const express = require("express");
const router = express.Router();
const multer = require('multer');

const {Post} = require('../Model/Post');
const {Counter} = require('../Model/Counter');
const {User} = require('../Model/User');

// 게시글 등록
router.post("/submit", (req, res) => {  
    let temp = {
      title: req.body.title,
      content: req.body.content,
      image: req.body.image
    };
    Counter.findOne({name: "counter"}).exec().then((counter) => {
      temp.postNum = counter.postNum;
      User.findOne({uid: req.body.uid}).exec().then((userInfo) => {
        temp.author = userInfo._id;
        const CommunityPost = new Post(temp);
        CommunityPost.save().then(() => {
          Counter.updateOne({name: "counter"}, {$inc : {postNum : 1}}).then(()=> {
          res.status(200).json({ success: true});
          })
        })
      });
    }).catch((err)=> {
      res.status(400).json({ success: false});
    });
    
  });
  
  // 게시글 목록 불러옴
  router.post("/list", (req, res) => {  

    let sort = {};

    if(req.body.sort === "최신순") {
      sort.createdAt = -1;
    } else {

      sort.repleNum = -1;
    }
    Post.find({$or : [{title: {$regex : req.body.searchTerm}},
       {content: {$regex : req.body.searchTerm}}]}).populate("author").sort(sort).skip(req.body.skip).limit(5).exec().then((doc) => {
      res.status(200).json({ success: true, postList: doc});
    }).catch((err) => {
      res.status(400).json({ success: false});
    });
  });
  
  // 게시글 불러오기
  router.post("/detail", (req, res) => {  
    Post.findOne({postNum : Number(req.body.postNum)}).populate("author").exec().then((doc) => {
      
      res.status(200).json({ success: true, postList: doc});
    }).catch((err) => {
      res.status(400).json({ success: false});
    });
  });
  
  // 게시글 수정
  router.post("/edit", (req, res) => {  
    let temp = {
      title: req.body.title,
      content: req.body.content
    }
    Post.updateOne({postNum : Number(req.body.postNum)}, {$set: temp}).exec().then(() => {
      
      res.status(200).json({ success: true});
    }).catch((err) => {
      res.status(400).json({ success: false});
    });
  });
  
  // 게시글 삭제
  router.post("/delete", (req, res) => {  
    Post.deleteOne({postNum : Number(req.body.postNum)}).exec().then(() => {
  
      res.status(200).json({ success: true });
    }).catch((err) => {
      res.status(400).json({ success: false });
    });
  });


  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'image/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + '-' + file.originalname)
    }
  });
  
  const upload = multer({ storage: storage }).single("file");


  // 이미지 업로드
  router.post("/image/upload", (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false });
      } else {
        res.status(200).json({ success: true, filePath: res.req.file.path});  
      }
    })
  })



module.exports = router;