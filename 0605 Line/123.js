import axios from 'axios'
import csv from 'csvtojson'
import iconv from 'iconv-lite'

const g = async () => {
  const { data } = await axios.get(
    'https://data.taipei/api/dataset/a835f3ba-7f50-4b0d-91a6-9df128632d1c/resource/267d550f-c6ec-46e0-b8af-fd5a464eb098/download',
    {
      responseType: 'arraybuffer',
    },
  )
  // console.log(data)
  const f = await csv({}).fromString(iconv.decode(new Buffer(data), 'Big5'))
  console.log(f)
}
g()
