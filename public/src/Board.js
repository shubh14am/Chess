/* eslint-disable no-loop-func */

let socket  = io();

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


var move = function(val,si,sj,di,dj){ // move constructor
	this.val = val;
	this.si = si;
	this.sj = sj;
	this.di = di;
	this.dj = dj;
}


// board class will contain all board data and player data
var Board = (function () {

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


	// all data of board
	var boardStats = {
		me : "",
		opponent : "",
		thisPlayer : 1,
		player : 1, // cur active player on board
		check : false,
		grid : Array(8),
		valToPiece:M,

		pieceToVal : {
			black_pawn : -1,
			white_pawn : 1,
			black_rook : -10,
			white_rook : 10,
			black_knight : -8,
			white_knight : 8,
			black_bishop : -6,
			white_bishop : 6,
			black_queen : -100,
			white_queen : 100,
			black_king : -1000,
			white_king : 1000
		},

		selected : {
			i: -1, // void cell
			j: -1,
			val: 0
		},
		AI:0
	}

	return {
		// public methods

		data : boardStats,
		togglePlayer : function(){
			boardStats.player *= -1;
		},
		toggleAI : function(){
			boardStats.AI ^= 1;
		},
		setPlayer : function(p){
			boardStats.thisPlayer = p
		},
		setOpponent : function(op){
			boardStats.opponent = op
		},
		setme : function(me){
			boardStats.me = me
		},
		setcheck : function(c){
			boardStats.check = c
		},

		setSelected : function(i,j,val){
			boardStats.selected.i = i;
			boardStats.selected.j = j;
			boardStats.selected.val = val;
		},

		makeMove:function(mov){
			boardStats.grid[mov.di][mov.dj] = boardStats.grid[mov.si][mov.sj];
			boardStats.grid[mov.si][mov.sj] = 0;
		},

		setPiece: function(i,j,val){boardStats.grid[i][j] = val;},

		initval : function(){
			boardStats.grid = new Array(8);
			for (let i = 0; i < 8; i++) {
				boardStats.grid[i] = new Array(8);
				for (let j = 0; j < 8; j++) boardStats.grid[i][j] = 0;
			}
			boardStats.check = false;
			let p = boardStats.thisPlayer;
			let V = boardStats.pieceToVal;
			for (let j = 0; j < 8; j++) {
				boardStats.grid[1][j] = -1 * p;
				boardStats.grid[6][j] = 1 * p;
			}
			boardStats.grid[7][0] = V.white_rook * p;
			boardStats.grid[7][7] = V.white_rook * p;
			boardStats.grid[0][0] = V.black_rook * p;
			boardStats.grid[0][7] = V.black_rook * p;
			boardStats.grid[7][1] = V.white_knight * p;
			boardStats.grid[7][6] = V.white_knight * p;
			boardStats.grid[0][1] = V.black_knight * p;
			boardStats.grid[0][6] = V.black_knight * p;
			boardStats.grid[7][2] = V.white_bishop * p;
			boardStats.grid[7][5] = V.white_bishop * p;
			boardStats.grid[0][2] = V.black_bishop * p;
			boardStats.grid[0][5] = V.black_bishop * p;
			boardStats.grid[7][3] = V.white_queen * p;
			boardStats.grid[7][4] = V.white_king * p;
			boardStats.grid[0][3] = V.black_queen * p;
			boardStats.grid[0][4] = V.black_king * p;
		}
	};
})();



var chessLogic = (function(){


	var shuffle = function(valid_moves) {
		for (let i = valid_moves.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			let temp = valid_moves[i];
			valid_moves[i] = valid_moves[j];
			valid_moves[j] = temp;
		}
	}

	var evaluate = function(){
		let sum = 0;
		for(let i = 0;i<8;i++){
			for(let j = 0;j<8;j++){
				sum += Board.data.grid[i][j];
			}
		}
		return sum;
	}

	var	miniMax = function(p,depth,alpha,beta){
		if(depth === 0){
			return evaluate();
		}
		let vm = chessLogic.genAll(p);
		shuffle(vm); // randomize moves
		let ans = (p === 1)?-100000:100000;
		for(let i = 0;i<vm.length;i++){
			let si = vm[i].si;
			let sj = vm[i].sj;
			let di = vm[i].di;
			let dj = vm[i].dj;
			let f = Board.data.grid[si][sj];
			let s = Board.data.grid[di][dj];

			Board.makeMove(vm[i]);

			let cur = miniMax(-p,depth-1,alpha,beta);

			if(p === 1){
				ans = Math.max(ans,cur);
				alpha = Math.max(alpha,cur);
			}else{
				ans = Math.min(ans,cur);
				beta = Math.min(beta,cur);
			} 
			// undo move
			Board.setPiece(si,sj,f);
			Board.setPiece(di,dj,s);

			if(alpha >= beta)break;  // prune next branches
		}
		return ans;
  	}

	return {

		CM_pawn : function(i, j, val) {
			let v = Board.data.thisPlayer * val;
			let si = i,sj = j;
			let cnt = 1;
			let tmp = i;
			if (v === -1 && i === 1) cnt = 2;
			if (v === 1 && i === 6) cnt = 2;
			let cur = [];
			while (i - v >= 0 && i - v < 8 && cnt-- > 0 && Board.data.grid[i - v][j] === 0) {
				cur.push(new move(val,si,sj,i-v,j));
				i -= v;
			}
			i = tmp;
			if (i - v >= 0 && i - v < 8 && j + 1 < 8 && Board.data.grid[i - v][j + 1] * val < 0 ) {
				cur.push(new move(val,si,sj,i-v,j+1));
			}
			if ( i - v >= 0 && i - v < 8 && j - 1 >= 0 && Board.data.grid[i - v][j - 1] * val < 0 ) {
				cur.push(new move(val,si,sj,i-v,j-1));
			}
			return cur;
		},

		CM_bishop_rook : function(i, j, val, isRook) {
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
				while ( j + dc[it] < 8 && j + dc[it] >= 0 && i + dr[it] >= 0 && i + dr[it] < 8 && Board.data.grid[i + dr[it]][j + dc[it]] * val <= 0 ) {
					cur.push(new move(val,si,sj,i+dr[it],j+dc[it]));
					if (Board.data.grid[i + dr[it]][j + dc[it]] * val < 0)
						break;
					i += dr[it];
					j += dc[it];
				}
			}
			return cur;
		},

		CM_queen : function(i, j, val) {
			let cur = [];
			let a = chessLogic.CM_bishop_rook(i, j, val, true);
			let b = chessLogic.CM_bishop_rook(i, j, val, false);
			cur = a.concat(b);
			return cur;
		},

		CM_king : function(i, j, val) {
			let cur = [];
			for (let R = i - 1; R <= i + 1; R++) {
				for (let C = j - 1; C <= j + 1; C++) {
					if (i === R && j === C) continue;
					if (R < 0 || R >= 8 || C < 0 || C >= 8) continue;
					if (val * Board.data.grid[R][C] > 0) continue;
					cur.push(new move(val,i,j,R,C));
				}
			}
			return cur;
		},

		CM_knight : function(i, j, val) {
			let cur = [];
			let dr = [-2, -1, 1, 2, 2, 1, -1, -2];
			let dc = [1, 2, 2, 1, -1, -2, -2, -1];
			for (let it = 0; it < 8; it++) {
				if ( i + dr[it] < 0 || i + dr[it] >= 8 || j + dc[it] >= 8 || j + dc[it] < 0 )
					continue;
				if (Board.data.grid[i + dr[it]][j + dc[it]] * val > 0) continue; // same team
				cur.push(new move(val,i,j,i+dr[it],j+dc[it]));
			}
			return cur;
		},

		isValid : function(i, j, val,valid_moves) {
			let ok = false;
			if (Board.data.player !== Board.data.thisPlayer || val * Board.data.player < 0) return false;

			for (let it = 0; it < valid_moves.length; it++) {
				if (valid_moves[it].di === i && valid_moves[it].dj === j && valid_moves[it].val === val)
					ok = true;
			}
			return ok;
		},

		gen : function(val,i,j){
			let cur = [];
			switch (val) {
				case 1:
					cur = chessLogic.CM_pawn(i, j, val);
					break;
				case -1:
					cur = chessLogic.CM_pawn(i, j, val);
					break;
				case 10:
					cur = chessLogic.CM_bishop_rook(i, j, val, true);
					break;
				case -10:
					cur = chessLogic.CM_bishop_rook(i, j, val, true);
					break;
				case 8:
					cur = chessLogic.CM_knight(i, j, val);
					break;
				case -8:
					cur = chessLogic.CM_knight(i, j, val);
					break;
				case 6:
					cur = chessLogic.CM_bishop_rook(i, j, val, false);
					break;
				case -6:
					cur = chessLogic.CM_bishop_rook(i, j, val, false);
					break;
				case 1000:
					cur = chessLogic.CM_king(i, j, val);
					break;
				case -1000:
					cur = chessLogic.CM_king(i, j, val);
					break;
				case 100:
					cur = chessLogic.CM_queen(i, j, val);
					break;
				case -100:
					cur = chessLogic.CM_queen(i, j, val);
					break;
				default:
			}
			return cur;
		},

		genAll : function(val){ // generate all moves for a specific player
			let all = [];
			for(let i = 0;i<8;i++){
				for(let j = 0;j<8;j++){
					if(val * Board.data.grid[i][j] <= 0)continue;
					let cur = chessLogic.gen(Board.data.grid[i][j],i,j);
					for(let it = 0;it<cur.length;it++)
					all.push(cur[it]);
				}
			}
			return all;
		},

  		AI_move : function(){

			let valid_moves = chessLogic.genAll(-Board.data.thisPlayer);
			shuffle(valid_moves);
			let mn = 10000;
			let bestMove = new move(0,0,0,0,0);
			for(let i = 0;i<valid_moves.length;i++){
				let si = valid_moves[i].si;
				let sj = valid_moves[i].sj;
				let di = valid_moves[i].di;
				let dj = valid_moves[i].dj;

				let f = Board.data.grid[si][sj];
				let s = Board.data.grid[di][dj];
				Board.makeMove(valid_moves[i]);

				let cur = miniMax(Board.data.thisPlayer,5,-10000,10000);
				if(cur < mn){
					mn = cur;
					bestMove = valid_moves[i];
				}
				// undo move i.e backtrack
				Board.setPiece(si,sj,f);
				Board.setPiece(di,dj,s);
			}
			if(mn > 500){ // ai has lost 

				// todo

			}
			Board.makeMove(bestMove);
			Game.refresh();
  		},

		check_winner : function(){
			let score = evaluate();
			let winner = 0;
			if(score < -500){ // black wins
				winner = -1;
			}else if(score > 500){ // white wins
				winner = 1;
			}
			if(winner === 0)return;
			if(winner === Board.data.thisPlayer){
				UIctrl.youWon();
				B.initval();
				Game.refresh();
			}else{
				if(AI){
					UIctrl.aiWon();
				}else{
					UIctrl.youLost();
				}
				B.initval();
				Game.refresh();
			}
		},

		isKingSafe : function(x){
			let tmp = Board.data.grid[x.di][x.dj];
			let v = true;
			Board.makeMove(new move(-1,x.si,x.sj,x.di,x.dj));
			let all = chessLogic.genAll(-Board.data.thisPlayer);
			for(let i = 0;i<all.length;i++){
				if(Board.data.grid[all[i].di][all[i].dj] * Board.data.thisPlayer === 1000)v = false;
			}
			// undo move
			Board.makeMove(new move(-1,x.di,x.dj,x.si,x.sj));
			Board.setPiece(x.di,x.dj,tmp);
			return v;
  		}
	}

})();

// UI controller will interact with board data to show board activity


var UIctrl = (function(){


  	return {

		buildGrid : function(){
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

					let rem = (Board.data.thisPlayer === 1 ? 0 : 1);
					if ((i + j) % 2 === rem) {
					document.getElementById(a).classList.add("black");
					} else {
					document.getElementById(a).classList.add("white");
					}
				}
			}
		},

		markCells : function(valid_moves){
			for(let i = 0;i<valid_moves.length;i++){
				if(!chessLogic.isKingSafe(valid_moves[i]))continue;
				let r = valid_moves[i].di;
				let c = valid_moves[i].dj;
				document.getElementById("c" + (r+10) + (c + 10) + "").classList.add("highlight");
			}
		},

		refresh : function(){
			for (let i = 0; i < 8; i++){
				for (let j = 0; j < 8; j++) {
					let val = Board.data.grid[i][j];
					let a = "c" + (i + 10) + "" + (j + 10);
					let cell = document.getElementById(a);
					let rem = (Board.data.thisPlayer === 1 ? 0 : 1);
					cell.className = (i + j) % 2 === rem ? "black" : "white";
					cell.classList.add(Board.data.valToPiece[val]);
					if(Board.data.check && Board.data.grid[i][j]*Board.data.thisPlayer === 1000){
						cell.classList.add("selected");
					}
				}
			}
		},

		checkMate : function(){
			swal({
				title: "Check Mate!!",
				text: "Game over",
				icon: "info",
				button: "Start New"
			});
		},

		connectionMade : function(data){
			swal({
				title: "Connected",
				text: "connection made with " + data,
				icon: "success",
				button: "Yayy!",
			})
		},

		loggedIn : function(data){
			swal({
		  		title: "Success",
		  		text: "Logged in as " + data,
		  		icon: "success",
		  		button: "Yayy!",
			});
		},

		youWon : function(){
			swal({
				title: "Congratulations!!",
				text: "you won 🙂",
				icon: "info",
				button: "Yayy!"
			});
		},

		youLost : function(){
			swal({
				title: "You Played well",
				text: "AI won !",
				icon: "info",
				button: "Wow!"
			});
		},

		aiWon : function(){
			swal({
				title: "You Played well",
				text: "AI won !",
				icon: "info",
				button: "Wow!"
			});
		}
  	}

})();



// socket object for all socket connections and event management
var socketConnection = (function(B){

  	return {

		create : function(){
			// join room
			create.addEventListener("click",()=>{
				socket.emit('login',{
				id:inid.value
				})
			})
			socket.on('joinedRoom',()=>{
				create.style.display = "none";
				inid.style.display = "none";
				B.setme(inid.value);
				myid.style.display = "block";
				myid.textContent = ("Your id :-   " + B.data.me);
				inid.value = "";
				UIctrl.loggedIn(B.data.me);
			})
		},

		joinAndAdd : function(){
		// join and add opponent
			join.addEventListener("click",()=>{
				// make joining player second
				B.setPlayer(-1); // set 
				socket.emit('join',{
					from:B.data.me,
					to:joinid.value
				})
			})


			socket.on('connectionMade',(to)=>{

				if(B.data.opponent === ""){
					Board.initval();
					Game.initBoard();
					Game.refresh();
					B.setOpponent(to.with);
					join.style.display = "none";
					joinid.style.display = "none";
					opid.style.display = "block";
					opid.textContent = ("Opponent id :-   " + B.data.opponent);
					socket.emit('join',{
						from : B.data.me,
						to : B.data.opponent
					})
					joinid.value = "";
					UIctrl.connectionMade(B.data.opponent);
				}
			})
		},

		sendNrcvMsg : function(){
		// send msg
		sendbtn.addEventListener('click',()=>{
			let node = document.createElement("div");
			node.classList.add("sentmsg");
			node.classList.add("msgbox");
			node.innerHTML = msg.value;
			msgbox.appendChild(node);
			socket.emit('newmsg',{
			to : B.data.opponent,
			val : msg.value
			})
			msg.value = "";
		})

		// rcv msg
		socket.on('gotmsg',(data)=>{
			let node = document.createElement("div");
			node.classList.add("rcvmsg");
			node.classList.add("msgbox");
			node.innerHTML = data.msg;
			msgbox.appendChild(node);
		})

		}
  	}

})(Board);




// main Game object to initialise event listerners ans start all the action

var Game = (function(B,UI,IO){ // input parameters are board object and UI ctrl object and socket connections


	var setupEventListeners = function(){
		// 1-> setup socket connections and event listeners
		IO.create();
		IO.joinAndAdd();
		IO.sendNrcvMsg();
		
		updateMove();

		// 2-> init value on data grid
		B.initval();

	}

	var updateMove = function(){
		socket.on('rcv_up',(data)=>{   // on recieving update.. set updates and invert the board
			if(data.si === -1){ // reset board
				UI.youWon();
				B.initval();
			}else {
				B.makeMove(data);
				B.togglePlayer();
			}
			refresh();
		})
	}

	var refresh =  function () {

		let all = chessLogic.genAll(-B.data.thisPlayer);
		let check = false;
		for(let i = 0;i<all.length;i++){
			if(B.data.grid[all[i].di][all[i].dj] * B.data.thisPlayer === 1000)check = true;
		}

		B.setcheck(check);
		UI.refresh();
		chessLogic.check_winner();

		if(B.data.check && B.data.player === B.data.thisPlayer){ // see if check mate is possible
			all = chessLogic.genAll(B.data.thisPlayer);
			let checkMate = true;
			for(let i = 0;i<all.length;i++){
				let tmp = B.data.grid[all[i].di][all[i].dj]; // make move
				B.data.grid[all[i].di][all[i].dj] = B.data.grid[all[i].si][all[i].sj];
				B.data.grid[all[i].si][all[i].sj] = 0;
				let opAll = chessLogic.genAll(-B.data.thisPlayer);
				let end = false;
				for(let j = 0;j<opAll.length;j++){
					if(B.data.grid[opAll[j].di][opAll[j].dj] * B.data.thisPlayer === 1000){
						end = true;
					}
				}
				if(!end)checkMate = false;
				B.data.grid[all[i].si][all[i].sj] = B.data.grid[all[i].di][all[i].dj];
				B.data.grid[all[i].di][all[i].dj] = tmp; // undo
			}
			if(checkMate){
				setTimeout(() => {
					UI.checkMate(); 
				}, 1000);
				setTimeout(() => {
					socket.emit('send_up',{  // send reset signal for new game
						to:B.data.opponent,
						si:-1,
						sj:-1,
						di:-1,
						dj:-1
					})
					B.initval();
					refresh();
				}, 2000);
			}
		}
		if(B.data.player === B.data.thisPlayer){
			if(B.data.check)document.getElementById('turnmsg').textContent= "Check!!";
			else document.getElementById('turnmsg').textContent= "Your Turn";
		}else{
			document.getElementById('turnmsg').textContent = "";
		}

	}

  	return {
		refresh : refresh,

		initBoard : function () { // add event listeners on the board
			refresh();
			for (let i = 0; i < 8; i++) {
				for (let j = 0; j < 8; j++) {
				let x = i + 10;
				let y = j + 10;
				let a = "c" + x + "" + y; //id for each cell is c + 10+i and 10+j

				document.getElementById(a).addEventListener("click", function () {
					refresh();
					let val = B.data.grid[i][j];
					let something_selected = B.data.selected.val !== 0;
					let same_pos = B.data.selected.i === i && B.data.selected.j === j;
					let same_team = true;
					if (something_selected)
					same_team = B.data.grid[B.data.selected.i][B.data.selected.j] * B.data.grid[i][j] > 0;

					if (!something_selected) {
						B.setSelected(i,j,val);
						if (val * B.data.thisPlayer > 0){
							document.getElementById("c" + (i + 10) + (j + 10) + "").classList.add("selected");
							UI.markCells(chessLogic.gen(val,i,j)); // mark generated valid cells
						}
					} else if (same_pos || same_team) {
						// tapping on same cell twice || killing same team
						B.setSelected(-1,-1,0);
					} else {
						let pi = B.data.selected.i;
						let pj = B.data.selected.j;
								
						if (chessLogic.isValid(i, j, B.data.selected.val , chessLogic.gen(B.data.grid[pi][pj],pi,pj)) && chessLogic.isKingSafe(new move(B.data.selected.val ,pi ,pj ,i ,j))) {
							B.makeMove(new move(-1,pi,pj,i,j));
							if(B.data.AI){
								B.togglePlayer();
								refresh();
							}
							if(B.data.AI){
								setTimeout(() => {
									chessLogic.AI_move();
									B.togglePlayer();
									refresh();
								}, 500);
							}else{
								socket.emit('send_up',{  // send move to opponent to update their ui
									to : B.data.opponent,
									si : 7 - B.data.selected.i,
									sj : B.data.selected.j,
									di : 7-i,
									dj : j
								});
								B.togglePlayer();
							}
							refresh();
						}
						// now nothing selected
						B.setSelected(-1,-1,0);
					}
				});
				}
			}
		},

		init : setupEventListeners
  }

})(Board,UIctrl,socketConnection);


aibtn.addEventListener('change',()=>{
	Board.toggleAI();
	Board.initval();
	Game.initBoard();
	Game.refresh();
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
});  

UIctrl.buildGrid();
Game.init();