import axios from 'axios';
import csv from 'csvtojson';
import iconv from 'iconv-lite';
import { distance } from '../utils/distance.js';
import template from '../templates/garbagecan.js';
import fs from 'fs';//檔案處理

export default async (event) => {
  try {
    // 下載並解析 CSV 檔案，生成 f
    const { data: csvData } = await axios.get(
      'https://data.taipei/api/dataset/a835f3ba-7f50-4b0d-91a6-9df128632d1c/resource/267d550c-c6ef-46e0-b8af-fd5a464eb098/download',
      { responseType: 'arraybuffer' }
    );
    const f = await csv({}).fromString(iconv.decode(Buffer.from(csvData), 'Big5'));

    // 映射 f 的欄位到原始 API 期望的欄位
    const mappedData = f.map((item) => ({
      Latitude: parseFloat(item.緯度 || item.latitude || 0), // 轉為數字，處理可能的字串格式
      Longitude: parseFloat(item.經度 || item.longitude || 0),
      City: item.城市 || '台北市', // 假設資料為台北市，根據實際欄位調整
      Town: item.鄉鎮 || '',
      Address: item.地址 || item.address || '',
      Name: item.店名 || item.name || '',
      Tel: item.電話 || item.phone || '',
      PicURL: item.圖片 || item.image_url || 'https://media.istockphoto.com/id/928418914/zh/%E5%90%91%E9%87%8F/%E5%9E%83%E5%9C%BE%E6%A1%B6-%E5%9E%83%E5%9C%BE%E6%A1%B6-%E5%9E%83%E5%9C%BE%E7%AE%B1%E5%9C%96%E7%A4%BA.jpg?s=612x612&w=0&k=20&c=bCccDul_sGWxWwAyEkLZbntSVljunB1eMEUIg9OFnQY=', // 預設圖片
      Url: item.網站 || item.website || ''
    }));

    const bubbles = mappedData
      // 加上距離欄位
      .map((value) => {
        value.distance = distance(
          value.Latitude,
          value.Longitude,
          event.message.latitude,
          event.message.longitude,
          'K'
        );
        return value;
      })
      // 依照距離排序
      .sort((a, b) => a.distance - b.distance)
      // 取出前三筆
      .slice(0, 3)
      // 套用 flex 模板
      .map((value) => {
        const address = value.City + value.Town + value.Address;
        const url = value.Url || `https://www.google.com/maps/place/${encodeURIComponent(address)}`;
        const bubble = template();
        // bubble.hero.url = value.PicURL;
        bubble.hero.action.uri = url;
        bubble.body.contents[0].text = value.行政區;
        bubble.body.contents[1].contents[0].contents[1].text = address;
        // bubble.body.contents[1].contents[1].contents[1].text = value.Tel;
        // bubble.footer.contents[0].action.uri = url;
        bubble.footer.contents[1].action.uri = `https://www.google.com/maps/place/${encodeURIComponent(address)}`;
        return bubble;
      });

    const result = await event.reply({
      type: 'flex',
      altText: '附近垃圾桶',//預覽聊天室
      contents: {
        type: 'carousel',//輪播
        contents: bubbles
      }
    });
    console.log(result);

    
    if (result.message) {
      await event.reply('發生錯誤');
      //如果是開發環境，而且傳送訊息錯誤時
      if (process.env.DEV === 'true') {
        fs.writeFileSync(
          './dump/garbagecan.json',
          JSON.stringify(
           bubbles,
            null,
            2
          )
        );
      }
    }
  } catch (error) {
    console.error(error);
    await event.reply('發生錯誤');
  }
};