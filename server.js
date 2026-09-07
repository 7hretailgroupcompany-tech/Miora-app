const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'vXX.X';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const DAILY_TIME = process.env.WHATSAPP_DAILY_TIME || '10:00';

app.get('/api/whatsapp/health', (req,res)=>res.json({ok:true,message: ACCESS_TOKEN && PHONE_NUMBER_ID ? 'WhatsApp backend configured' : 'Backend running; add Meta environment variables before sending'}));

app.post('/api/whatsapp/send-template', async (req,res)=>{
  const {to, templateName, languageCode='en', components=[]} = req.body || {};
  if(!to || !templateName) return res.status(400).json({ok:false,error:'to and templateName are required'});
  if(!ACCESS_TOKEN || !PHONE_NUMBER_ID || GRAPH_VERSION==='vXX.X') return res.status(503).json({ok:false,error:'WhatsApp Cloud API is not configured on the server. Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_GRAPH_VERSION.'});
  const url=`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;
  try{
    const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'template',template:{name:templateName,language:{code:languageCode},components}})});
    const data=await r.json();
    res.status(r.status).json(data);
  }catch(e){res.status(502).json({ok:false,error:e.message});}
});

app.post('/api/whatsapp/webhook', (req,res)=>res.sendStatus(200));
app.get('/api/whatsapp/webhook',(req,res)=>{
  if(req.query['hub.verify_token']===VERIFY_TOKEN) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});

// Manual/cron trigger endpoint. The app can call this after loading its local customer/product data.
app.post('/api/whatsapp/run-daily', async (req,res)=>{
  const {product, customers=[], templateName='daily_product', languageCode='en'} = req.body || {};
  if(!product || !product.name) return res.status(400).json({ok:false,error:'product.name is required'});
  if(!Array.isArray(customers)) return res.status(400).json({ok:false,error:'customers must be an array'});
  if(!ACCESS_TOKEN || !PHONE_NUMBER_ID || GRAPH_VERSION==='vXX.X') return res.status(503).json({ok:false,error:'WhatsApp Cloud API is not configured on the server.'});
  const results=[];
  for(const c of customers.filter(x=>x && x.optIn && x.phone)){
    try{
      const r=await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,{method:'POST',headers:{Authorization:`Bearer ${ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:String(c.phone).replace(/\D/g,''),type:'template',template:{name:templateName,language:{code:languageCode},components:[{type:'body',parameters:[{type:'text',text:String(product.name)},{type:'text',text:String(product.code||'')}]}]}})});
      const data=await r.json(); results.push({phone:c.phone,name:c.name||'',ok:r.ok,data});
    }catch(e){ results.push({phone:c.phone,name:c.name||'',ok:false,error:e.message}); }
  }
  res.json({ok:true,product,attempted:results.length,results});
});

app.get('/api/whatsapp/webhook-status',(req,res)=>res.json({ok:true,configured:Boolean(ACCESS_TOKEN && PHONE_NUMBER_ID && GRAPH_VERSION!=='vXX.X'),dailyTime:DAILY_TIME}));

// Express 5 requires named wildcards. This version also matches the root URL.
app.get('/{*splat}',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT,()=>console.log(`Miora app running on http://localhost:${PORT}`));
