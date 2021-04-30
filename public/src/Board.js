/* eslint-disable no-loop-func */

let AI = 0;
let socket  = io();

let opponent = "";
let me = "";

let thisPlayer = 1;


var Board = (function () {
  // Board class

  let G = document.getElementById("Board");
  for (let i = 0; i < 8; i++) {
    let node = document.createElement("tr");
    G.appendChild(node);
    let row = G.lastChild;
    for (let j = 0; j < 8; j++) {
      node = document.createElement("td");
      let x = i + 10;
      let y = j + 10;
      let a = "c" + x + "" + y; //id for each cell is c + 10+i and 10+j

      row.appendChild(node);
      row.lastChild.id = a;

      let rem = (thisPlayer === 1 ? 0 : 1);
      if ((i + j) % 2 === rem) {
        document.getElementById(a).classList.add("black");
      } else {
        document.getElementById(a).classList.add("white");
      }
    }
  }

  var M = {};
  M[-1] = "black_pawn";
  M[1] = "white_pawn";
  M[-10] = "black_rook";
  M[10] = "white_rook";
  M[8] = "white_knight";
  M[-8] = "black_knight";
  M[6] = "white_bishop";
  M[-6] = "black_bishop";
  M[100] = "white_queen";
  M[-100] = "black_queen";
  M[1000] = "white_king";
  M[-1000] = "black_king";

  function move(val,si,sj,di,dj){ // move constructor
    this.val = val;
    this.si = si;
    this.sj = sj;
    this.di = di;
    this.dj = dj;
  }
  var player = 1;
  var selected = {
    i: -1, // void cell
    j: -1,
    val: 0
  };
  var grid = new Array(8);
  for (let i = 0; i < 8; i++) {
    grid[i] = new Array(8);
    for (let j = 0; j < 8; j++) grid[i][j] = 0;
  }
  function initval() {
    for(let i = 0;i<8;i++){
      for(let j = 0;j<8;j++){
        grid[i][j] = 0;
      }
    }
    for (let j = 0; j < 8; j++) {
      grid[1][j] = -1*thisPlayer;
      grid[6][j] = 1*thisPlayer;
    }
    grid[7][0] = 10*thisPlayer;
    grid[7][7] = 10*thisPlayer;
    grid[0][0] = -10*thisPlayer;
    grid[0][7] = -10*thisPlayer;
    grid[7][1] = 8*thisPlayer;
    grid[7][6] = 8*thisPlayer;
    grid[0][1] = -8*thisPlayer;
    grid[0][6] = -8*thisPlayer;
    grid[7][2] = 6*thisPlayer;
    grid[7][5] = 6*thisPlayer;
    grid[0][2] = -6*thisPlayer;
    grid[0][5] = -6*thisPlayer;
    grid[7][3] = 100*thisPlayer;
    grid[7][4] = 1000*thisPlayer;
    grid[0][3] = -100*thisPlayer;
    grid[0][4] = -1000*thisPlayer;
  }


  function CM_pawn(i, j, val) {
    let v = thisPlayer*val;
    let si = i,sj = j;
    let cnt = 1;
    let tmp = i;
    if (v === -1 && i === 1) cnt = 2;
    if (v === 1 && i === 6) cnt = 2;
    let cur = [];
    while (i - v >= 0 && i - v < 8 && cnt-- > 0 && grid[i - v][j] === 0) {
      cur.push(new move(val,si,sj,i-v,j));
      i -= v;
    }
    i = tmp;
    if (i - v >= 0 && i - v < 8 && j + 1 < 8 && grid[i - v][j + 1] * val < 0 ) {
      cur.push(new move(val,si,sj,i-v,j+1));
    }
    if ( i - v >= 0 && i - v < 8 && j - 1 >= 0 && grid[i - v][j - 1] * val < 0 ) {
      cur.push(new move(val,si,sj,i-v,j-1));
    }
    return cur;
  }
  function CM_bishop_rook(i, j, val, isRook) {
    let si = i;
    let sj = j;
    let br = [1, -1, -1, 1];
    let bc = [1, 1, -1, -1];
    let rr = [1, -1, 0, 0];
    let rc = [0, 0, 1, -1];
    let dr = isRook ? rr : br;
    let dc = isRook ? rc : bc;
    let cur = [];
    for (let it = 0; it < 4; it++) {
      i = si;
      j = sj;
      while ( j + dc[it] < 8 && j + dc[it] >= 0 && i + dr[it] >= 0 && i + dr[it] < 8 && grid[i + dr[it]][j + dc[it]] * val <= 0 ) {
        cur.push(new move(val,si,sj,i+dr[it],j+dc[it]));
        if (grid[i + dr[it]][j + dc[it]] * val < 0) break;
        i += dr[it];
        j += dc[it];
      }
    }
    return cur;
  }
  function CM_queen(i, j, val) {
    let cur = [];
    let a = CM_bishop_rook(i, j, val, true);
    let b = CM_bishop_rook(i, j, val, false);
    cur = a.concat(b);
    return cur;
  }
  function CM_king(i, j, val) {
    let cur = [];
    for (let R = i - 1; R <= i + 1; R++) {
      for (let C = j - 1; C <= j + 1; C++) {
        if (i === R && j === C) continue;
        if (R < 0 || R >= 8 || C < 0 || C >= 8) continue;
        if (val * grid[R][C] > 0) continue;
        cur.push(new move(val,i,j,R,C));
      }
    }
    return cur;
  }
  function CM_knight(i, j, val) {
    let cur = [];
    let dr = [-2, -1, 1, 2, 2, 1, -1, -2];
    let dc = [1, 2, 2, 1, -1, -2, -2, -1];
    for (let it = 0; it < 8; it++) {
      if ( i + dr[it] < 0 || i + dr[it] >= 8 || j + dc[it] >= 8 || j + dc[it] < 0 )
        continue;
      if (grid[i + dr[it]][j + dc[it]] * val > 0) continue; // same team
      cur.push(new move(val,i,j,i+dr[it],j+dc[it]));
    }
    return cur;
  }
  function markCells(valid_moves){
    for(let i = 0;i<valid_moves.length;i++){
      let r = valid_moves[i].di;
      let c = valid_moves[i].dj;
      document.getElementById("c" + (r+10) + (c + 10) + "").classList.add("highlight");
    }
  }
  function isValid(i, j, val,valid_moves) {
    let ok = false;
    if (player !== thisPlayer || val*player < 0) return false;

    for (let it = 0; it < valid_moves.length; it++) {
      if (valid_moves[it].di === i && valid_moves[it].dj === j && valid_moves[it].val === val)
        ok = true;
    }
    return ok;
  }

  function evaluate(){
    let sum = 0;
    for(let i = 0;i<8;i++){
      for(let j = 0;j<8;j++){
        sum += grid[i][j];
      }
    }
    return sum;
  }
  function gen(val,i,j){
    let cur = [];
    switch (val) {
      case 1:
        cur = CM_pawn(i, j, val);
        break;
      case -1:
        cur = CM_pawn(i, j, val);
        break;
      case 10:
        cur = CM_bishop_rook(i, j, val, true);
        break;
      case -10:
        cur = CM_bishop_rook(i, j, val, true);
        break;
      case 8:
        cur = CM_knight(i, j, val);
        break;
      case -8:
        cur = CM_knight(i, j, val);
        break;
      case 6:
        cur = CM_bishop_rook(i, j, val, false);
        break;
      case -6:
        cur = CM_bishop_rook(i, j, val, false);
        break;
      case 1000:
        cur = CM_king(i, j, val);
        break;
      case -1000:
        cur = CM_king(i, j, val);
        break;
      case 100:
        cur = CM_queen(i, j, val);
        break;
      case -100:
        cur = CM_queen(i, j, val);
        break;
      default:
    }
    return cur;
  }
  function genAll(val){ // generate all moves for a specific player
    let all = [];
    for(let i = 0;i<8;i++){
      for(let j = 0;j<8;j++){
        if(val * grid[i][j] <= 0)continue;
        let cur = gen(grid[i][j],i,j);
        for(let it = 0;it<cur.length;it++)
          all.push(cur[it]);
      }
    }
    return all;
  }
  function shuffle(valid_moves) {
    for (let i = valid_moves.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = valid_moves[i];
        valid_moves[i] = valid_moves[j];
        valid_moves[j] = temp;
    }
  }

  var cnt = 0;
  function miniMax(p,depth,alpha,beta){
    cnt++;
    if(depth === 0){
      return evaluate();
    }
    let vm = genAll(p);
    shuffle(vm);
    if(p === 1){
      let mx = -100000;
      for(let i = 0;i<vm.length;i++){
        let si = vm[i].si;
        let sj = vm[i].sj;
        let di = vm[i].di;
        let dj = vm[i].dj;

        let f = grid[si][sj];
        let s = grid[di][dj];
        grid[di][dj] = grid[si][sj];
        grid[si][sj] = 0;
        let cur = miniMax(-p,depth-1,alpha,beta);
        mx = Math.max(mx,cur);

        grid[si][sj] = f;
        grid[di][dj] = s;
        alpha = Math.max(alpha,cur);
        if(alpha >= beta)break;
      }
      return mx;
    }else{
      let mn = 10000;
      for(let i = 0;i<vm.length;i++){
        let si = vm[i].si;
        let sj = vm[i].sj;
        let di = vm[i].di;
        let dj = vm[i].dj;

        let f = grid[si][sj];
        let s = grid[di][dj];
        grid[di][dj] = grid[si][sj];
        grid[si][sj] = 0;
        let cur = miniMax(-p,depth-1,alpha,beta);
        mn = Math.min(mn,cur);
        beta = Math.min(beta,cur);
        grid[si][sj] = f;
        grid[di][dj] = s;
        if(alpha >= beta)break;
      }
      return mn;
    }
  }

  function AI_move(){
    cnt = 0;
    let valid_moves = genAll(-thisPlayer);
    shuffle(valid_moves);
    let mn = 10000;
    let bestMove = new move(0,0,0,0,0);
    for(let i = 0;i<valid_moves.length;i++){
      let si = valid_moves[i].si;
      let sj = valid_moves[i].sj;
      let di = valid_moves[i].di;
      let dj = valid_moves[i].dj;

      let f = grid[si][sj];
      let s = grid[di][dj];
      grid[di][dj] = grid[si][sj];
      grid[si][sj] = 0;

      let cur = miniMax(thisPlayer,5,-10000,10000);
      if(cur < mn){
        mn = cur;
        bestMove = valid_moves[i];
      }
      // console.log(cur);
      grid[si][sj] = f;
      grid[di][dj] = s;
    }
    console.log(cnt);
    grid[bestMove.di][bestMove.dj] = grid[bestMove.si][bestMove.sj];
    grid[bestMove.si][bestMove.sj] = 0;
    Board.refresh();
  }

  function check_winner(){
    let score = evaluate();
    let winner = 0;
    if(score < -500){ // black wins
      winner = -1;
    }else if(score > 500){ // white wins
      winner = 1;
    }
    if(winner === 0)return;
    if(winner === thisPlayer){
      swal({
        title: "Congratulations!!",
        text: "you won 🙂",
        icon: "info",
        button: "Yayy!",
      });
      initval();
      Board.refresh();
    }else{
      if(AI){
        swal({
          title: "You Played well",
          text: "AI won !",
          icon: "info",
          button: "Wow!",
        });
      }else{
        swal({
          title: "Better luck next time",
          text: "you lost 🙁",
          icon: "info",
          button: "OK",
        });
      }
      initval();
      Board.refresh();
    }
  }

  return {
    // public methods

    // return multiple funcn as JSON
    Grid: grid,
    invert:function(){player *= -1;},

    makeMove:function(data){
      Board.Grid[data.di][data.dj] = Board.Grid[data.si][data.sj];
      let id = "c" + (data.si + 10) + (data.sj + 10) + "";
      let b = (data.si + data.sj) % 2 === 0 ? "black" : "white";
      document.getElementById(id).className = b;
      Board.Grid[data.si][data.sj] = 0;
      Board.invert();
      Board.refresh();
    },


    refresh: function () {
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
          let val = Board.Grid[i][j];
          let a = "c" + (i + 10) + "" + (j + 10);
          let cell = document.getElementById(a);
          let rem = (thisPlayer === 1 ? 0 : 1);
          cell.className = (i + j) % 2 === rem ? "black" : "white";
          cell.classList.add(M[val]);
        }
      check_winner();

      if(player === thisPlayer){
        document.getElementById('turnmsg').style.display = "block";
      }else{
        document.getElementById('turnmsg').style.display = "none";
      }

    },

    // initialise the board and setup event listeners
    init: function () {
      initval();
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          let x = i + 10;
          let y = j + 10;
          let a = "c" + x + "" + y; //id for each cell is c + 10+i and 10+j

          document.getElementById(a).addEventListener("click", function () {
            Board.refresh();
            let val = Board.Grid[i][j];
            let something_selected = selected.val !== 0;
            let same_pos = selected.i === i && selected.j === j;
            let same_team = true;
            if (something_selected)
              same_team = Board.Grid[selected.i][selected.j] * Board.Grid[i][j] > 0;

            if (!something_selected) {
              selected.val = val;
              selected.i = i;
              selected.j = j;
              if (val)document.getElementById("c" + (i + 10) + (j + 10) + "").classList.add("selected");
              markCells(gen(val,i,j)); // mark generated valid cells
            } else if (same_pos || same_team) {
              // tapping on same cell twice || killing same team
              selected.i = -1;
              selected.j = -1;
              selected.val = 0;
            } else {
              let pi = selected.i;
              let pj = selected.j;
              
              if (isValid(i, j, selected.val,gen(Board.Grid[pi][pj],pi,pj))) {
                Board.Grid[i][j] = selected.val;

                let id = "c" + (pi + 10) + (pj + 10) + "";
                let b = (pi + pj) % 2 === 0 ? "black" : "white";

                document.getElementById(id).className = b;
                Board.Grid[pi][pj] = 0;
                if(AI){
                  Board.invert();
                  Board.refresh();
                }
                if(AI)setTimeout(() => {
                  AI_move();
                  Board.invert();
                  Board.refresh();
                }, 1000);
                else{
                  socket.emit('send_up',{  // send move to opponent to update their ui
                    to:opponent,
                    si:7 - selected.i,
                    sj:selected.j,
                    di:7-i,
                    dj:j
                  })
                  Board.invert();
                }

                Board.refresh();
              }

              // now nothing selected
              selected.i = -1;
              selected.j = -1;
              selected.val = 0;
            }
          });
        }
      }
    }
  };
})();






let create = document.getElementById('create');
let join = document.getElementById('join');
let inid = document.getElementById('inid');
let joinid = document.getElementById('joinid');
let sendbtn = document.getElementById('sendbtn');
let msg = document.getElementById('typemsg');
let aibtn = document.getElementById('aibtn');
let msgbox = document.querySelector('.msg');
let myid = document.querySelector('.myid');
let opid = document.querySelector('.opid');

// initially hidden
myid.style.display = "none";
opid.style.display = "none";

aibtn.addEventListener('change',()=>{
  AI ^= 1;
  Board.init();
  Board.refresh();
  if(aibtn.checked){
    create.style.display = "none";
    join.style.display = "none";
    inid.style.display = "none";
    joinid.style.display = "none";
  }
  else {
    create.style.display = "inline-block";
    join.style.display = "inline-block";
    inid.style.display = "inline-block";
    joinid.style.display = "inline-block";
  }
})




// join room
create.addEventListener("click",()=>{
  socket.emit('login',{
    id:inid.value
  })
})
socket.on('joinedRoom',()=>{
  create.style.display = "none";
  inid.style.display = "none";
  me = inid.value;
  myid.style.display = "block";
  myid.textContent = ("Your id :-   " + me);
  inid.value = "";
  swal({
    title: "Success",
    text: "Logged in as " + me,
    icon: "success",
    button: "Yayy!",
  });
})



// join and add opponent
join.addEventListener("click",()=>{
   // make joining player second
  thisPlayer = -1;
  socket.emit('join',{
    from:me,
    to:joinid.value
  })
})
socket.on('connectionMade',(to)=>{

  if(opponent === ""){
    Board.init();
    Board.refresh();
    opponent = to.with;
    join.style.display = "none";
    joinid.style.display = "none";
    opid.style.display = "block";
    opid.textContent = ("Opponent id :-   " + opponent);
    socket.emit('join',{
      from:me,
      to:opponent
    })
    joinid.value = "";
    swal({
      title: "Connected",
      text: "connection made with " + opponent,
      icon: "success",
      button: "Yayy!",
    });
  }
})




// send nd recieve msg
sendbtn.addEventListener('click',()=>{
  let node = document.createElement("div");
  node.classList.add("sentmsg");
  node.classList.add("msgbox");
  node.innerHTML = msg.value;
  msgbox.appendChild(node);
  socket.emit('newmsg',{
    to:opponent,
    val:msg.value
  })
  msg.value = "";
})
socket.on('gotmsg',(data)=>{
  let node = document.createElement("div");
  node.classList.add("rcvmsg");
  node.classList.add("msgbox");
  node.innerHTML = data.msg;
  msgbox.appendChild(node);
})

socket.on('rcv_up',(data)=>{   // on recieving update.. set updates and invert the board
  Board.makeMove(data);
})