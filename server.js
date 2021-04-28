const express = require("express")
const app = express()
const http = require('http')
const server = http.createServer(app)
const socketio = require('socket.io')

const io = socketio(server)

var users = {};

io.on('connection',(socket)=>{
    console.log("connected with socket id = " + socket.id);
    socket.on('login',(game)=>{  // join room
        socket.join(game.id);
        users[game.id] = 1;
        console.log("new connection with " + game.id);
        socket.emit('joinedRoom');
    })
    socket.on('join',(data)=>{   // join opponent from both side
        if(users[data.to]){
            socket.to(data.to).emit('connectionMade',{
                with:data.from
            })   
        }
    })
    socket.on('newmsg',(data)=>{
        socket.to(data.to).emit('gotmsg',{
            msg:data.val
        })
    })    
    socket.on('send_up',(data)=>{
        socket.to(data.to).emit('rcv_up',{
            si:data.si,
            sj:data.sj,
            di:data.di,
            dj:data.dj
        })
    })
})



app.use('/',express.static(__dirname+'/public'))


server.listen(8080 || process.env.PORT ,()=>{
    console.log("server started at port 3000");
})

