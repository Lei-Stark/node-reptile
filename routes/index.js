var express = require('express');
var router = express.Router();
const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const dbimg = require('../modules/db_image')

/* GET home page. */
router.get('/', async (request, res, next) => {

  let selectpath = []

  let getdbimage = await GetImages(request.query.name)
  // console.log("getdbimage---->", getdbimage);


  // let getUrldata = await getdata(request.query).then((data) => {
  //   console.log('[index.js-selectpath]', data);
  //   console.log('selectpath------------', selectpath);
  //   res.json({ data: data })
  // })



  function GetImages (imgname) {
    return new Promise((resolve, reject) => {
      let selectpath = []
      dbimg.GetImage(imgname).then((data) => {
        if (data.length > 0) {
          data.forEach(e => {
            selectpath.push(e.link)
          });
          resolve(selectpath);
        }

      }).catch((err) => {
        console.log(err);
      })


    }).then((selectpath) => {



      getdata(request.query).then((data) => {
        console.log(data.title);
        let link = data.link
        res.json({ data: link })
        console.log('网站查出来的条数', link.length);
        console.log('数据库查出来的条数', selectpath.length);
        selectpath.forEach(e => {
          if (link.indexOf(e) > -1) {
            link.splice(link.indexOf(e), 1)
          }
        });
        console.log('[index.js-selectpath]', link.length);
        let inisetlist = []
        link.forEach(e => {
          let obj = [request.query.name, e]
          inisetlist.push(obj)
        });


        console.log('准备插入数据库的数据条数', inisetlist.length);
        if (inisetlist.length > 0) {
          dbimg.AddImage(inisetlist).then((data) => {
            console.log('插入数据成功');
          }).catch((err) => {
            console.log(err);
          })

        }


      });



    })







  }
})
//node 爬虫
//翻译接口
//http://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=你好
function getdata (querydata) {
  console.log(querydata);

  let name = `search=${querydata.name}&lang=Chinese`;
  let smallurl = 'search.php?';
  let bigimgurl = 'big.php?';
  let urls = 'https://wall.alphacoders.com/';
  let url = urls + smallurl + name + '&page=' + querydata.page;
  let size = '&w=1440&h=900&type=stretch';
  let bigurl = urls;
  console.log(url);

  return axios.get(encodeURI(url)).then(function (response) {
    let $ = cheerio.load(response.data);
    let datas = $('.center>.thumb-container-big');

    return new Promise((resolve, reject) => {

      let len = 1

      let content = {
        link: [],
        title: []
      }
      datas.each((index, el) => {
        let s = $(el).find('a').attr('href').toString();
        content.title.push($(el).find('a').attr('title').toString())
        let u = bigurl + s;


        axios.get(u).then(res => {
          len++;
          let $ = cheerio.load(res.data);
          let data = $('.main-content').attr('src');
          content.link.push(data)
          if (len === datas.length) {
            resolve(content)
          }
        })
      })
    })

  }).catch(function () {
    console.log();
  })









}










module.exports = router;
