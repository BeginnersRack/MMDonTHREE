



function getNowTimeOnWorld(){
	return (new Date()).getTime(); //ミリ秒  (clock.elapsedTime は秒なので注意)
}

let dummyStarttime1 = getNowTimeOnWorld();
let dummyStarttime2 = getNowTimeOnWorld();

var dummyMySwitch =0;


// 近辺にいるキャラの一覧を取得する(前回からの差分)
function searchEDI(position, limittedFilterAry=null , myCallback=null){

	// for test
	if(dummyMySwitch>3) dummyMySwitch = 0;



	
	let ans= new Map();
	// (id,updateTime) updateTime=0なら、可視範囲外
	
	
	
	let dymmyUpdateTime = getNowTimeOnWorld();
	
	if((!limittedFilterAry)||(limittedFilterAry.some(value=>{value=="miku01"}))){
	
		if(dummyMySwitch==4){
			ans.set("miku01", 0 ); 
		}else{
			ans.set("miku01", getNowTimeOnWorld() );
		}
	
	}
	
	
	if((!limittedFilterAry)||(limittedFilterAry.some(value=>{value=="test"}))){
		ans.set("test", dummyStarttime2 );
	}




	if(typeof(myCallback)=="function"){
		setTimeout( function(){myCallback(ans)} ,100);
	}else{
		return(ans);
	}
	
}






// 指定されたキャラの最新情報を取得する
function requestEDI_modelObj(modelID,myCallback=null){
	let ans=null;
	
	switch(modelID){
	  case "miku01":
		ans= new Map([
			 ["name","miku"] 
			,["updateTime", getNowTimeOnWorld() ]
			,["meshSourceType","MMD"]
			,["meshSource",'_mmd/models/miku/miku_v2.pmd']
			,["rotate",{x:0,y:90,z:0}]
			,["position",{x:0,y:-10,z:0}]
			,["basepose","base01"]
			,["motion","wave1"]   // 
			,["motionStarttime", dummyStarttime1 ]  // (getNowTimeOnWorld()-50000)
		]);
				switch(dummyMySwitch){
					case 1:
						ans.set("motion",0);
						break;
					case 2:
						ans.set("motion","vmd02");
						ans.set("motionStarttime",0);
						break;
					case 3:
						ans.set("motion","vmd03");
						ans.set("motionStarttime",0);
						break;
					default:
						break;
				}
		break;

	  case "test":
		ans= new Map([
			 ["name","testObj"] 
			,["updateTime", getNowTimeOnWorld() ]
			,["meshSourceType","BasicMaterial"]
			,["meshSource",new Map([
					 ["GeometryType" , "Sphere"]
					,["GeometryParameter" , [4,40,40] ]
					,["TextureImage" , "files/earthmap1k.jpg" ]
					,["MeshMaterialType" , "Standard"]
					,["MeshMaterialParameter" , {} ]
			 ])]
			,["rotate",{x:0,y:0,z:0}]
			,["position",{x:-20,y:10,z:20}]
			,["moveStarttime", dummyStarttime2 ]
			,["move","mymove01"]   //  mymove01
			,["moveParameters", new Map([
				 ["x",new Map([
					 ["f_spantime", 10000 ],["f_endvalue", 0 ]
					,["targerPropertyTreePath", ["position","x"] ] // moveObj指定が優先される("move"値が'default'時に有効)
				 ])]
				,["y",new Map([
					 ["f_spantime", 10000 ],["f_endvalue", 0 ]
				 ])]
				,["z",new Map([
					 ["f_spantime", 10000 ],["f_endvalue", -10 ]
				 ])]
				,["rotation",new Map([
					 ["f_spantime", 5000 ],["f_loopcount", 0 ]
					,["AudioClipId", "correct2"],["audioDelayTime",50]
				 ])]
			 ])]
		]);
		
		
		let fev=0;
		let mp = ans.get("moveParameters");
		let mp_x = mp.get("x");
		fev= (gui_checkbox_api["test01"]?-10:200);
		if(fev!=mp_x.get("f_endvalue")){
			mp_x.set("f_endvalue" ,  fev  );
			mp_x.set("f_starttime" ,  dummyStarttime2  );
		}
		let mp_y = mp.get("y");
		fev=(gui_checkbox_api["test02"]?-10:10);
		if(fev!=mp_y.get("f_endvalue")){
			mp_y.set("f_endvalue" ,   fev   );
			mp_y.set("f_starttime" ,  dummyStarttime2  );
		}
				
		break;

	  case "xxx":
		ans= new Map([
		//	 ["name","miku"] 
		//	,["updateTime", (new Date()) ]   データの更新時刻
		//	,["meshSourceType","MMD"]     		{ MMD,BasicMaterial }
		//	,["basepose","base01"]      		MMD用 ポーズデータ
		//	,["meshSource", '_mmd/models/miku/miku_v2.pmd'] 	MMDならPMDファイルパス
		//	,["meshSource",new Map([                        	Materialならそのパラメータ
		//			 ["GeometryType" , "Sphere"]
		//			,["GeometryParameter" , [4,40,40] ]
		//			,["TextureImage" , "files/earthmap1k.jpg" ]
		//			,["MeshMaterialType" , "Standard"]
		//			,["MeshMaterialParameter" , {} ]
		//	 ])]
		//	,["rotate",{x:0,y:90,z:0}]      基本方向
		//	,["position",{x:0,y:-10,z:0}]   基本位置 (モーションとムーブの加算前の位置)
		//	,["motion","wave1"]   // 
		//	,["motionUpdatetime", dummyStarttime ]  // 未定義の場合はmotionStarttimeを使用
		//	,["motionStarttime", dummyStarttime ]  // モーションの開始時刻
		//	,["move","mymove01"]   // 
		//	,["moveStarttime", dummyStarttime ]    // ムーブの開始時刻
		//以下管理用
		//	,["moveExecuteFlg", null ]    // ムーブ終了 (ローカルで作成する：EDIでは送信しない）
		// ,["meshUuid",'']
		// ,["MotionObjects", ....
		// ,["AudioObjects", ....
		]);
	  default:
		break;
	}
	
	if(typeof(myCallback)=="function"){
		setTimeout( function(){myCallback(ans)} ,100);
	}else{
		return(ans);
	}
}



function requestEDI_poseObj(poseID,myCallback=null){
	let ans=null;
	
	switch(poseID){
	  case "base01":
		ans= new Map([
			 ["name","base01"] , ["vpdClip",null] , ["file_url",'_mmd/basepose01.vpd'] 
		]);
		break;

	  case "xxx":
		ans= new Map([
		]);
	  default:
		break;
	}
	
	if(typeof(myCallback)=="function"){
		setTimeout( function(){myCallback(ans)} ,100);
	}else{
		return(ans);
	}
	
}



function requestEDI_motionObj(motionID,myCallback=null){
	let ans=null;
	
	switch(motionID){
	  case "wave1":
		ans= new Map([
			 ["name","wavefile"]
			,["VmdLoop",false]
			,["file_url",'_mmd/vmds/wavefile_v2.vmd']
			,["AudioClipId","wavefile"]
			,["audioDelayTime",160000/30]
			

		]);
		break;

	  case "vmd01":
		ans= new Map([
			 ["name","vmd01"]
			,["VmdLoop",true]
			,["file_url",'_mmd/vmds/天子タンバリン_p23.vmd']
			,["AudioClipId","tambourine"]
			,["audioDelayTime",0]
		]);
		break;
	  case "vmd02":
		ans= new Map([
			 ["name","vmd02"]
			,["VmdLoop",true]
			,["file_url",'_mmd/vmds/A01_SO_女の子歩き_p40.vmd']
			,["AudioClipId","walk01"]
			,["audioDelayTime",0]
			,["audioVolume",5]
		]);
		break;
		
	  case "vmd03":
		ans= new Map([
			 ["name","vmd03"]
			,["VmdLoop",true]
			,["file_url",'_mmd/vmds/H02_SO_女の子走り_p20.vmd']
			,["AudioClipId","walk01"]
			,["audioDelayTime",0]
			,["audioSpeed",1.5]
			,["audioVolume",5]
		]);
		break;
	  case "vmd04":
		ans= new Map([
			 ["name","vmd04"]
			,["VmdLoop",true]
			,["file_url",'_mmd/vmds/H54_SO_力強い走り_p16.vmd']
			,["AudioClipId","walk01"]
			,["audioDelayTime",0]
			,["audioSpeed",2]
			,["audioVolume",5]
		]);
		break;
		
		
	  case "xxx":
		ans= new Map([
		//	 ["name","wavefile"]
		//	,["VmdLoop",false]
		//	,["file_url",'_mmd/vmds/wavefile_v2.vmd']
		//	,["AudioClipId","wavefile"]
		//	,["audioDelayTime",160000/30]
		//以下管理用
		// ,["VmdClipUuid",'']
		]);
		break;
	  default:
		break;
	}
	
	
	if(typeof(myCallback)=="function"){
		setTimeout( function(){myCallback(ans)} ,100);
	}else{
		return(ans);
	}
}


function requestEDI_AudioObj(audioID,myCallback=null){
	let ans=null;
	
	switch(audioID){
	  case "wavefile":
		ans= new Map([
		 	["file_url",'_mmd/audios/wavefile_short.mp3']
		]);
		break;

	  case "tambourine":
		ans= new Map([
		 	["file_url",'_mmd/audios/correct2.mp3']
		]);
		break;
	  case "correct2":
		ans= new Map([
		 	["file_url",'_mmd/audios/correct2.mp3']
		]);
		break;

	  case "walk01":
		ans= new Map([
		 	["file_url",'_mmd/audios/walk-tatami1_s.wav']
		]);
		break;


	  case "xxx":
		ans= new Map([
		//	["file_url",'_mmd/audios/walk-tatami1_s.wav']
		//以下管理用
		// ["AudioClipUuid",'']
		// ["AudioClip",null],["AudioClipReserve",null]
		]);
		break;
	  default:
		break;
	}
	
	if(typeof(myCallback)=="function"){
		setTimeout( function(){myCallback(ans)} ,100);
	}else{
		return(ans);
	}
}


function requestEDI_moveObj(moveID,myCallback=null){
	let ans=null;
	
	switch(moveID){
	  case "mymove01":
		ans= new Map([
			 ["name","mymove-01"]
			,["onceOnlyFlg",true]
			,["movLoop",0]
			,["properties" , new Map([
				 ["x",new Map([
					 ["targerPropertyTreePath", ["position","x"] ]
					,["calcFunction", "function(nowRate , f_hAry , parentObj , propertyName){ "+
						"let nowval = parentObj[propertyName];"+
						"let delta = (f_hAry.f_endvalue - nowval) * 0.99;"+
						"return (f_hAry.f_endvalue - delta); }"
					  ]
				 ])]
				,["y",new Map([
					 ["targerPropertyTreePath", ["position","y"] ]
					,["calcFunction", "function(nowRate , f_hAry , parentObj , propertyName){ "+
						"let delta = (f_hAry.f_endvalue - f_hAry.f_startvalue) * Math.sin(nowRate * Math.PI / 2);"+
						"return (f_hAry.f_startvalue + delta); }"
					  ]
				 ])]
				,["z",new Map([
					 ["targerPropertyTreePath", ["position","z"] ]
					,["calcFunction", "function(nowRate , f_hAry , parentObj , propertyName){ "+
						"let delta = (f_hAry.f_endvalue - f_hAry.f_startvalue) * nowRate; "+
						"return (f_hAry.f_startvalue + delta); }"
					  ]
				 ])]
				,["rotation",new Map([
					 ["targerPropertyTreePath", ["rotation"] ]
					,["calcFunction", "function(nowRate , f_hAry , parentObj , propertyName){ "+
						"parentObj.rotation.set(parentObj.rotation.x,parentObj.rotation.y,  Math.PI*2 * nowRate );"+
						"return (false); }"
					  ]
				 ])]
			 ])]


		]);
		break;

		
	  case "xxx":
		ans= new Map([
		//	 ["name","mymove-01"]
		//	,["onceOnlyFlg",true] 再利用なし（メモリ上に保存しない）
		//	,["movLoop",0]   0は無限回を示す
		//	,["AudioClipId","correct2"]
		//	,["audioDelayTime",0]
		//	,["audioSpeed",1.5]
		//	,["audioVolume",5]
		//以下管理用
		// ,["",'']
		]);
		break;
	  default:
		break;
	}
	
	
	if(typeof(myCallback)=="function"){
		setTimeout( function(){myCallback(ans)} ,100);
	}else{
		return(ans);
	}
}

