const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'vXX.X';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

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
  const verifyToken=process.env.WHATSAPP_VERIFY_TOKEN || '';
  if(req.query['hub.verify_token']===verifyToken) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT,()=>console.log(`Miora app running on http://localhost:${PORT}`));
