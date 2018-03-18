
var express = require('express')
var cors = require('cors')
var app = express()
var storage = require('node-persist')

app.use(cors())


var users,requests=[]

app.listen(8080, async () => {
    try{
    await storage.init({forgiveParseErrors: true});
    await initStorage(false);
    console.log('api up on 8080')
    }
    catch (err)
    {

      console.log("Error in starting api:"+err)
      await initStorage(true)
    }
  })


  app.get('/getuser/:user_id', async (req, res, next) => {
    try{
        res.json(getUser(req.params.user_id))
      
    }
    catch (err)
    { 
      console.log("Err:"+err);
      res.json([])
    }
  })

  app.get('/getmyrequests/:user_id', async (req, res, next) => {
    try{
        res.json(getMyRequests(req.params.user_id))
      
    }
    catch (err)
    { 
      console.log("Err:"+err);
      res.json([])
    }
  })

  app.get('/updatemyrequest/:user_id/:request_id/:accepted', async (req, res, next) => {
    try{

      var action;
      if (req.params.accepted=="true")
      {
        action=true;
      }
      else
      {
        action = false;
      }

        for (var i = 0;i<requests.length;i++)
        {
          if (requests[i].id == req.params.request_id )
          {
            requests[i].accepted = action
            requests[i].actionTs = Date.now()
            await persistChanges()
            break
          }
        }
      
        res.json(getMyRequests(req.params.user_id))
    }
    catch (err)
    { 
      console.log("Err:"+err);
      res.json({error:"error handling request",message:err})
    }
  })

  function getUser(user_id)
  {
      return users.find(u=>user_id == u.id)
  }


  function getMyRequests(user_id)
  {
    var myReqs = requests.filter(r => r.to == user_id)
    if (myReqs!=undefined)
    {
      for (var i = 0;i<myReqs.length;i++)
      {
        myReqs[i].requester = users.find(u=>u.id == myReqs[i].from)
      }
    }
    else
    {
      myReqs=[];
    }
    return myReqs;
  }

  app.get('/resetserver', async (req, res, next) => {
    try{
        await initStorage(true);
        res.send(200);
      
    }
    catch (err)
    { 
      console.log("Err:"+err);
      res.send(500);
    }
  })

  async function persistChanges(){
    await storage.set("users",users)
    await storage.set("requests",requests)
  }

  async function initStorage(reset){
    try{
      users = await storage.get("users")
      if (users==undefined||reset){
        var initUsers = []
        initUsers.push({id:1,name:'Bob'})
        initUsers.push({id:2,name:'Jane'})
        initUsers.push({id:3,name:'Jill'})
        initUsers.push({id:4,name:'Rudy'})
        initUsers.push({id:5,name:'Svoboda'})
        await storage.set("users",initUsers)
        users = initUsers
      }
      requests = await storage.get("requests")
      if (requests==undefined||reset){
        var initRequests =[]
        initRequests.push({id:1,from:2,to:1,accepted:null,actionTs:null,ts:Date.now()})
        initRequests.push({id:2,from:3,to:1,accepted:null,actionTs:null, ts:Date.now()-864e5})
        initRequests.push({id:3,from:5,to:1,accepted:true,actionTs:Date.now()-((2*864e5)+3.6e+6), ts:Date.now()-2*864e5})
        initRequests.push({id:4,from:4,to:1,accepted:false,actionTs:Date.now()-((3*864e5)+3.6e+6), ts:Date.now()-((3*864e5)-3.6e+6)})
        await storage.set("requests",initRequests)
        requests = initRequests
      }
    
    }
    catch(err)
    {
      console.log("error initialising storage:" + err);
    }
  }

  module.exports = app;