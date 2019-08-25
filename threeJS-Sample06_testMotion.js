
var container, stats;
var camera, scene, renderer, effect ,listener;
var vamera_back,scene_back,skyDoom;
var mmd_helper, ikHelper, physicsHelper ;
var RenderReady = true;
var mousecontrols , meshMouseCntlTgt;

var gui;

var clock = new THREE.Clock();

const const_flgLoading ="loading"


// MMD modelMeshデータ格納用
var modelObjects = new Map();


//MMDポーズデータ格納用
var vpdObjects = new Map();

//画像データ格納用
var loadedImgObjects = new Map();
//音源データ格納用
var loadedAudioObjects = new Map();
//moveデータ格納用
var loadedMoveObjects = new Map();




let myRenderActionEnable=true;



// mmdLoader 
const myMMDLoader = new THREE.MMDLoader();




window.onload = () => {
	Ammo().then( function( AmmoLib ) {
    	Ammo = AmmoLib;
		init();
	});
}

function mystart(){

	mmd_helper.onBeforeUpdateMatrixWorld = function(mesh){
	    myRenderOverwrite(mesh);
	}
//	mmd_helper.onBeforePhysics = function(mesh){
//	    //myRenderOverwrite(mesh);
//	}




	initGui();
	
	
	// マウスによるカメラコントロール //FirstPersonControls:FlyControls:TrackBallControls:
	mousecontrols = new THREE.OrbitControls( camera, renderer.domElement );  

	// 画面サイズ変更への追従
	window.addEventListener( 'resize', onWindowResize, false );


	
	Render();	//描画開始
	

}
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	
	camera_back.aspect = camera.aspect;
	camera_back.updateProjectionMatrix();
	
	effect.setSize( window.innerWidth, window.innerHeight );
}






function myRenderOverwrite(mesh){
	let tgtMesh =mesh;
	if(!tgtMesh){
		if(modelObjects.has("miku01")){
		  let tgtMeshUuid=modelObjects.get("miku01").get("meshUuid");
		  tgtMesh=getMeshFromMmdHelper(tgtMeshUuid);
		  //tgtMesh=getMeshFromScene(tgtMeshUuid);
		}
	}

	if(tgtMesh){
	    let tgtbone=tgtMesh.children[0];//センター
	    if(tgtbone){
	      tgtbone = tgtbone.children[0];//上半身
	      if(tgtbone){
	        tgtbone = tgtbone.children[0];//首
	        if(tgtbone){
	          let headbone =  tgtbone.children[0];
	          tgtbone.rotation.y += gui_volume_api["neck_horizontal"];
	          tgtbone.rotation.x += gui_volume_api["neck_vertical"];
	        }
	      }
	    }
	}
}









function init() {
	//container = document.createElement( 'div' );
	//document.body.appendChild( container );
	container = document.getElementById('canvas3d');
	

    var sightLength = 5000;
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 10, sightLength );
	camera.position.x = 30;
	camera.position.y = 10;
	camera.position.z = 10;
	// scene
	scene = new THREE.Scene();
	//scene.background = new THREE.Color( 0xffffff );
	scene.fog = new THREE.Fog( 0xe0e0e0, (sightLength * 0.6), sightLength );



	var gridHelper1 = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
	gridHelper1.material.opacity = 0.2;
	gridHelper1.material.transparent = true;
	gridHelper1.position.y = - 10;
	scene.add( gridHelper1 );

	var gridHelper2 = new THREE.PolarGridHelper( 30, 10 );
	gridHelper2.position.y = - 10;
	scene.add( gridHelper2 );

	var ambient = new THREE.AmbientLight( 0x666666 );
	scene.add( ambient );
	var directionalLight = new THREE.DirectionalLight( 0x887766 );
	directionalLight.position.set( - 1, 1, 1 ).normalize();
	scene.add( directionalLight );
	//
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;    //camera_back,scene_back を使用して重ね表示させるため、自動クリアを無効にする

	camera_back = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, (sightLength*1.2));  //背景用
	scene_back = new THREE.Scene();
    var skyGeometry = new THREE.SphereGeometry((sightLength*1.1), 60, 40); 
    var skyLoader  = new THREE.TextureLoader();
    texture = skyLoader.load( "files/dome/樹冠の上.bmp",
        function(texture){
			var material = new THREE.MeshBasicMaterial({map:texture});
			skyDoom = new THREE.Mesh(skyGeometry,material);
			skyDoom.material.side = THREE.BackSide; //画像を裏側に貼り付け  outlineEffectを入れると機能しなくなる？
			//skyDoom.material.side =THREE.DoubleSide;
			
			
			
			
			
			skyDoom.position.set( camera.position.x, camera.position.y, camera.position.z );
			scene_back.add(skyDoom);
			//	scene_back.background = skyDoom;
			
        }
    );



	container.appendChild( renderer.domElement );
	

	effect = new THREE.OutlineEffect( renderer ,{
		     defaultThickness: 0.1
		  ,  defaultColor: [250,0,0]
		  ,  defaultAlpha: 0.0
		  ,  defaultKeepAlive: false  // keeps outline material in cache even if material is removed from scene
	});
    effect.enabled = true; //Outline問題：falseにすると一部パーツが見えなくなる（袖やスカートの裏地など）
                //  OutlineEffect.jsを少し改造して対応している
    



	// model setting // カメラ注視点の表示
    (function(){
			var geometry = new THREE.TorusGeometry(0.5, 0.2, 4, 12);
			var material = new THREE.MeshBasicMaterial({color: 0x6699FF});

			meshMouseCntlTgt = new THREE.Mesh(geometry,material);
			
			meshMouseCntlTgt.position.set( 10.0, 0.0, 0.0 );
			scene.add(meshMouseCntlTgt);
       
    }());





	// STATS
	stats = new Stats();
	container.appendChild( stats.dom );


    // Sound
	listener = new THREE.AudioListener();
	camera.add( listener );
		// listener.position.z = 1;



	
	
	
	/*
	 * Load PMX and VMD and Audio
	 */
	

	// Helper
	mmd_helper = new THREE.MMDAnimationHelper({ afterglow: 2.0, resetPhysicsOnLoop: true });
	//mmd_helper.enable( 'physics', false );
	
	


	//とりあえず基本ポーズだけはロードしておく。
	//myMMDDataLoader("pose","base01" ,null, mystart );
	
	mystart();
}
	
	
	
	
function myMMDDataLoader(type,codeId,parent=null , myCallback =nothing){
	let ans="error";
	//load済みかを確認する
	switch(type){
		case "pose":
			if(vpdObjects.has(codeId)){
				let tgtobj = vpdObjects.get(codeId);
				if(tgtobj.has("vpdClip")){
					if(tgtobj.get("vpdClip")){
						ans="";
					}else{
						let flg = myMMDDataLoader_sub(type,codeId,tgtobj , myCallback)
						if(flg){
							ans=const_flgLoading;
						}else{
							ans="error";
						}
					}
				}
			}else{
				console.log("ERROR mmdPoseLoader : "+type+" code["+codeId+"] is not registed." );
				
			}
			break;
		
		case "PMX":
			if(modelObjects.has(codeId)){
				let tgtobj = modelObjects.get(codeId);
				let val=0;
				if(tgtobj.has("meshUuid")){
					val = tgtobj.get("meshUuid");
				}
				if(val){ // loadが完了しているとは限らない
					if(val==const_flgLoading){ans=const_flgLoading;}
					else{ ans=""; }
				}else{
					let flg = myMMDDataLoader_sub(type,codeId,tgtobj , myCallback)
					if(flg){
						ans=const_flgLoading;
					}else{
						ans="error";
					}
				}
			}else{
				console.log("ERROR mmdPMXLoader : "+type+" code["+codeId+"] is not registed." );
			}
			break;
		
		
		
		case "VMD":
			if(modelObjects.has(parent)){
				let meshobj = modelObjects.get(parent);
				if(!meshobj.has("MotionObjects")){
					meshobj.set("MotionObjects", new Map() );
				}
				let motionobjs = meshobj.get("MotionObjects");
				let flg=1;
				if(motionobjs.has(codeId)){
					let tgtobj = motionobjs.get(codeId);
					if(tgtobj.has("VmdClipUuid")){
						let val = tgtobj.get("VmdClipUuid");
						if(val){ 
							flg=0; // loadが完了しているとは限らない
							if(val==const_flgLoading){ ans=const_flgLoading; }
							else{ ans=""; }
						}
					}
				}
				if(flg){
					flg = myMMDDataLoader_sub(type,codeId, parent , myCallback)
					if(flg){
						ans=const_flgLoading;
					}else{
						ans="error";
					}
				}
			}else{
				console.log("info - mmdVMDLoader : "+type+" code["+codeId+"] is not registed." );

				
			}
			break;
		
		case "audio":
			if(modelObjects.has(parent)){
				let meshobj = modelObjects.get(parent);
				let AudioObjects=meshobj.get("AudioObjects");
				if(!AudioObjects){
					meshobj.set("AudioObjects" , new Map() );
					AudioObjects=meshobj.get("MotionObjects");
				}
				let flg=1;
				if(AudioObjects.has(codeId)){
					let tgtobj = AudioObjects.get(codeId);
					if(tgtobj.has("AudioClipUuid")){
						let val = tgtobj.get("AudioClipUuid");
						if(val){ 
							flg=0; // loadが完了しているとは限らない
							if(val==const_flgLoading){ ans=const_flgLoading; }
							else{ ans=""; }
						}
					}
				}
				if(flg){
					myMMDDataLoader_sub(type,codeId,parent,myCallback);
				}
			}
			break;
		
		// switch-case 終わり
		default:
			break;
	}
	return(ans);
}



	
function myMMDDataLoader_sub(type,codeId,tgtobj , myCallback){

				/*
				 * Loading PMX or VMD or Voice
				 */
				onProgress = (xhr) => {
				  if (xhr.lengthComputable) {
				    const percentComplete = xhr.loaded / xhr.total * 100;
				    console.log(Math.round(percentComplete, 2) + '% downloaded '+ xhr.target.responseURL );
				  }
				}
				/* 
				 * loading error
				 */
				onError = (xhr) => {
				  console.log("ERROR "+ xhr.target.responseURL );
				}


	switch(type){
		case "pose":
			mmdPoseLoader([tgtobj] );
			break;
		case "PMX":
			mmdModelLoader( codeId , tgtobj );
			break;
		case "VMD":
			mmdVMDLoader( codeId , tgtobj );
			break;
		case "audio":
			myAudioLoader( codeId , tgtobj );
			break;

		default:
		break;
	}
	return(true);

	function jumpmyCallback(opt=null){
		if(typeof(myCallback)=="function"){
			myCallback(opt);
		}
	}

	// ***********

	async function mmdPoseLoader(vpdObjAry){
		//Loading vpd (Pose)
				function LoadVPD(vpdFilePath){
				    return new Promise( (resolve, reject) => {
				      if((typeof(vpdFilePath)=="string") && (vpdFilePath!="")){
				          myMMDLoader.loadVPD( vpdFilePath ,false , (vpd) => {
				              resolve(vpd);
				          }, onProgress, onError);
				      }else{
				          console.log("ERROR : mmdPoseLoader recieve incorrect filepath." );
				          reject(null);
				      }
				    });
				}
				var fncAdd =  function( fAry ,obj ) {
					fAry.push( new Promise( async function( resolve, reject ) {
					    var vpd = await LoadVPD(obj.get("file_url"));
					    obj.set("vpdClip", vpd );
					    resolve( vpd );
				    }))
				}
		var funcs=[];
		for(var obj of vpdObjAry) {
			fncAdd(funcs , obj);
		}
		await Promise.all( funcs );

		jumpmyCallback();
	}




	async function mmdVMDLoader( motionCode , modelObjectKey  ){

	
		//Loading VMD
				function LoadVMD(mesh00, filepath ){
				    return new Promise( (resolve, reject)=>{
				      myMMDLoader.loadAnimation(filepath, mesh00, (vmd) => {
				        resolve(vmd);
				      }, onProgress, onError);
				    });
				}
				var fncAdd =  function( fAry, mesh ,MotionObject ) {
					fAry.push( new Promise( async function( resolve, reject ) {
					    var vmd = await LoadVMD(mesh , MotionObject.get("file_url") ); 

						vmd.name = MotionObject.get("name");
						
						var loopFlg=MotionObject.get("VmdLoop");
						var mixer = mmd_helper.objects.get(mesh).mixer; // mmd_helper内の指定meshのmixer に登録する
						var animeAction = mixer.clipAction(vmd); // clip登録
						if (!loopFlg) {   //animation Loop Once
						    animeAction.setLoop(THREE.LoopOnce); //2200
						    animeAction.repetitions = 0;
						}else{
						    animeAction.setLoop(THREE.LoopRepeat); //2201
						    //action.repetitions = 0; // undefine = Infinity.
						}
						animeAction.clampWhenFinished = true;
						animeAction.stop();
						animeAction.reset();

					    MotionObject.set("VmdClipUuid", vmd.uuid );
					    resolve( vmd );
				    }))
				}

		let mesh =getMeshFromMmdHelper( modelObjects.get(modelObjectKey).get("meshUuid") );
		
		let modelMeshAAry = modelObjects.get(modelObjectKey);
		let MotionObjects=modelMeshAAry.get("MotionObjects");
		if(!MotionObjects){
			modelMeshAAry.set("MotionObjects" , new Map() );
			MotionObjects=modelMeshAAry.get("MotionObjects");
		}
		if(MotionObjects.has(motionCode)){
			callOfLoadVMD(mesh , MotionObjects.get(motionCode) )
		}else{
			requestEDI_motionObj(motionCode,function(aary){
				if(aary){
					aary.set("VmdClipUuid",const_flgLoading);
					modifyUpdateAAry(MotionObjects,motionCode,aary);
					callOfLoadVMD(mesh , MotionObjects.get(motionCode) );
				}
			});
		}
		
		async function callOfLoadVMD(mesh , motionAAry ){
			motionAAry.set("VmdClipUuid",const_flgLoading);

			let funcs=[];
			fncAdd(funcs ,mesh , motionAAry );
			await Promise.all( funcs );
			jumpmyCallback();
		}

		
	}



	async function mmdModelLoader( modelObjectKey , modelAAry ){
		// let modelAAry = modelObjects.get(modelObjectKey);
			
		//Loading PMX
				  function LoadPMX(modelFilePath){
				    return new Promise( (resolve, reject)=>{
				      myMMDLoader.load( modelFilePath , (mesh00) => {
				        resolve(mesh00);
				      }, onProgress, onError);
				    });
				  }
		var mesh = await LoadPMX( modelAAry.get("meshSource") );    

		
//		mesh.rotateX( Math.PI / 180 * modelAAry.get("rotate").x );
//		mesh.rotateY( Math.PI / 180 * modelAAry.get("rotate").y );
//		mesh.rotateZ( Math.PI / 180 * modelAAry.get("rotate").z );
//		mesh.position.x = modelAAry.get("position").x;
//		mesh.position.y = modelAAry.get("position").y;
//		mesh.position.z = modelAAry.get("position").z;
		
		
		
		//mmd_helper.pose(mesh, vpdObjects.get("base01").get("vpdClip") );
		let baseposeId = modelAAry.get("basepose");
		if( (baseposeId)&&(baseposeId!="") ){
			if(vpdObjects.has(baseposeId)){
				let vpd = vpdObjects.get(baseposeId).get("vpdClip");
				if(vpd){
					mmd_helper.pose(mesh, vpd );
					afterGetpose();
				}else{
					// now loading...
				}
			}else{
				requestEDI_poseObj(baseposeId, function(aary){
					if(aary){
						vpdObjects.set(baseposeId,aary);
						
						myMMDDataLoader("pose",baseposeId , null , function(){
							let vpd = vpdObjects.get(baseposeId).get("vpdClip");
							mmd_helper.pose(mesh, vpd );
							afterGetpose();
						});
					}
				});
			}
		}else{
			afterGetpose();
		}
		
		
		
		function afterGetpose(){
			
			
//			mmd_helper.add(mesh);     //ここから物理演算適用開始
//			var mixer = new THREE.AnimationMixer(mesh);
//			mmd_helper.objects.get(mesh).mixer=mixer;  // mesh.mixer=mixer;ではNGだった
			
			
			
			
			
			
			let k=0;
			if(k){
				if(effect.enabled){
					var tgt=mesh.material[3];
					tgt.outlineParameters = {
					    thickness: 0.01,
					    color: [250,0,0], // new THREE.Color( 0x800000 ),
					    alpha: 0.5,
					    visible: true,
					    keepAlive: false
					}
					//if (tgt.outlineParameters.thickness === 0.0) tgt.outlineParameters.visible = false;
				}else{
					// outline問題：あにまさ式ミク専用の強制修正：袖とスカート裏面の描画指定
					//mesh.material[3].side = THREE.DoubleSide;
				}
			}


			k=1;  //メッシュの光反射処理
			if(k){ 
				var phongMaterials = makePhongMaterials( mesh.material );
				mesh.material = phongMaterials;
			}
			
			

//			scene.add(mesh);  // scene に追加登録する
			
			
//			modelObjects.get(modelObjectKey).set("meshUuid" , mesh.uuid );
			
			
//			initMixer(mesh);
			
			jumpmyCallback(mesh);
		}

	}




	async function myAudioLoader( audioId ,modelObjectKey  ){
		const myAudioLoader = new THREE.AudioLoader();
		
		
				function LoadAudio( path ){
				    return new Promise( (resolve, reject)=>{
				      if (path && path!="") {
				        myAudioLoader.load(path, (buffer) => {
				             resolve(buffer);
				        }, onProgress, onError);
				      } else {
				        reject(false);
				      }
				    });
				}
				var fncAdd_Aud =  function( fAry, mesh ,AudioObject ) {
					fAry.push( new Promise( async function( resolve, reject ) {
						let path = AudioObject.get("file_url");
						let audioBuffer = null;
						if(loadedAudioObjects.has(path)){
							audioBuffer = loadedAudioObjects.get(path);
						}else{
							audioBuffer = await LoadAudio(path);
							if(audioBuffer) { loadedAudioObjects.set(path,audioBuffer); }
						}
						if(audioBuffer){
							          //var audio = new THREE.Audio(listener);
							          var audio = new THREE.PositionalAudio(listener);
							          audio.setBuffer(audioBuffer);
							          
							          audio.setLoop( false ); //audio.loop=false;
							          audio.setVolume( 1 );
							          
							          mesh.add( audio );
							          AudioObject.set("AudioClip", audio );
							          AudioObject.set("AudioClipUuid", audio.uuid );
						}
						resolve(true);
				    }))
				}
		
		let modelMeshAAry = modelObjects.get(modelObjectKey);
		let meshUuid = modelMeshAAry.get("meshUuid");
		let mesh =getMeshFromMmdHelper( meshUuid );
		if(!mesh){ mesh = getMeshFromScene(meshUuid); }
		
		let AudioObjects=modelMeshAAry.get("AudioObjects");
		if(AudioObjects.has(audioId)){
			callOfLoadAudio(modelMeshAAry , audioId )
		}else{
			requestEDI_AudioObj(audioId,function(aary){
				if(aary){
					aary.set("AudioClipUuid",const_flgLoading);
					modifyUpdateAAry(AudioObjects,audioId,aary);
					callOfLoadAudio(modelMeshAAry , audioId );
				}
			});
		}
		
		async function callOfLoadAudio(modelMeshAAry,audioId){
			let meshUuid = modelMeshAAry.get("meshUuid");
			let mesh =getMeshFromMmdHelper( meshUuid );
			if(!mesh){ mesh = getMeshFromScene(meshUuid); }
			let AudioObjects=modelMeshAAry.get("AudioObjects");
			
			if(AudioObjects.get(audioId)){
				let tgtaary = AudioObjects.get(audioId);
				tgtaary.set("AudioClipUuid",const_flgLoading);
				
				var funcs=[];
				fncAdd_Aud(funcs ,mesh , AudioObjects.get(audioId) );
				await Promise.all( funcs );
				
				jumpmyCallback();
			}
		}
		
	}


}






function makePhongMaterials( materials ) {
	var array = [];
	for ( var i = 0, il = materials.length; i < il; i ++ ) {
		var m = new THREE.MeshPhongMaterial();
		m.copy( materials[ i ] );
		m.needsUpdate = true;
		array.push( m );
	}
	return array;
}


function initMixer(mixer) {

    


	  // VMD Loop Event
	  mixer.addEventListener("loop", (event) => {
	    var msg="";
	    if(event.action){if(event.action._clip){
	        var clipname = event.action._clip.name;
	        if(clipname){
	            let modelkey = getKeyOfMeshFromUuid( event.target._root.uuid );
	            if(modelkey){
	                playSoundInClip(modelkey,clipname   ,0);
	                msg += clipname;
	            }
	        }
	    }}
	    
	    //console.log("loop "+msg);
	  });
	  // VMD Loop Once Event
	  mixer.addEventListener("finished", (event) => {
	    var msg="";
	    if(event.action){if(event.action._clip){
	        var clipname = event.action._clip.name;
	        if(clipname){
	            msg += clipname;
	        }
	        if(1==0){
		        setTimeout( function(){
		        	//event.action.stop()
		        	//actionStart(modelId,motionId,0 );
		        	event.action.fadeOut(0.5);
		        
		        	console.log("stopped action.");
		        } ,5000);
		    }
	    }}
	    console.log("finished "+msg);
	  });
  

}
function getKeyOfMeshFromUuid(MeshUuid){
	let ans=0;
	modelObjects.forEach(function (value, key) {
		if(value.get("meshUuid") == MeshUuid){
			ans = key;
		}
	});
	return ans;
}



function getMixer(helper,mesh) {
	var meshIndex = helper.meshes.indexOf( mesh );
	if(meshIndex == -1){
		return null;
	}
	return helper.objects.get(mesh).mixer;
}

function modifyUpdateAAry(parent,tgtCode,newAAry){
	if(newAAry){
		if(parent.has(tgtCode)){ // 更新
			let tgt=parent.get(tgtCode);
			newAAry.forEach(function (value, key){
				tgt.set(key,value);
			});
		}else{ // 新規登録
			parent.set(tgtCode,newAAry);
		}
	}
	return(parent.get(tgtCode));
}








function callEdiForUpdate(){
	console.log("start : callEdiForUpdate" );
	//dummyStarttime = getNowTimeOnWorld();

	// let nowtime = clock.elapsedTime
	let nowtime = getNowTimeOnWorld();
	
	
	searchEDI(camera.position , null , function(data){
		afterGetEdiCharaUpdateList(data);
	});
	
	function afterGetEdiCharaUpdateList(charaUpdateList){
		for(var key of charaUpdateList.keys()) {
			updateByEdiData(key , charaUpdateList.get(key) );
		}
	}
    
    

}

function updateByEdiData(key , charaUpdateTime){

	let flg=0; // 描画変更の要否  0は不要判定
	
	if(modelObjects.has(key)){
		let aaryVal = modelObjects.get(key);
		let oldFlg=aaryVal.get("disappearFlg");
		if(charaUpdateTime == 0){
			if(!oldFlg){
				aaryVal.set("disappearFlg",1);
				flg=1;
			}
		}else{
			if(oldFlg){
				aaryVal.delete("disappearFlg");
				flg=1;
			}
			let meshuuid = aaryVal.get("meshUuid");
			let lastupdate = aaryVal.get("updateTime");
			if(meshuuid){
				if(meshuuid!=const_flgLoading){
					if( charaUpdateTime >= lastupdate ){
						flg=1;
					}
				}
			}else{
				flg=1;
			}
			
		}
	}else{
		if(charaUpdateTime){ // charaUpdateTime=0ならこのキャラは非表示
			flg=1;
		}
	}
	
	// --
	if(flg){
		meshModelSetup( key );
	}

    

}


// モデル情報更新：取得済みデータから変更があったことは判定済み
function meshModelSetup(modelObjectKey){


    let loadedUuid = "";
    if(modelObjects.has(modelObjectKey)){
        loadedUuid = modelObjects.get(modelObjectKey).get("meshUuid");
    }
    if(loadedUuid==const_flgLoading){
        return 0; //既にロード処理が実行中である
    }
    
    
	let old_motionAction =0;
	let old_motionActionUpdtT =0;
	let tgt=modelObjects.get(modelObjectKey);
	if(tgt){
		old_motionAction = tgt.get("motion");
		old_motionActionUpdtT=tgt.get("motionUpdatetime");
	}
    
    
    //メッシュモデル諸元をEDI取得する
    requestEDI_modelObj(modelObjectKey,function(aary){
		if(aary){
			let newary = modifyUpdateAAry(modelObjects,modelObjectKey,aary);
			
			checkDisappearFlg(modelObjectKey,newary);
			
		}
    });
    


	function checkDisappearFlg(modelObjectKey , meshAary){
		// let meshAary = modelObjects.get(modelObjectKey);
		
		let disappearFlg=0;
		if(meshAary){
			let flg = meshAary.get("disappearFlg");
			if(flg){
				disappearFlg=1;
			}
		}
		
		if(disappearFlg){
			let mUuid = meshAary.get("meshUuid");
			if(mUuid){
				let mesh = getMeshFromMmdHelper(mUuid);
				if(mesh){
					mesh.visible=false;
				}
			}
		}else{
			//mesh.visible=true;
			startModelCheck(modelObjectKey, meshAary);
		}
	}
	

	function startModelCheck(modelObjectKey,meshAary){
			let sourceType = meshAary.get("meshSourceType");
			switch(sourceType){
				case "MMD":
					checkMMDModelLoaded(modelObjectKey);
					break;
				case "BasicMaterial":
					checkBasicMaterialExisted(modelObjectKey);
					break;
				default:
					console.log("unknown meshSourceType : ["+sourceType+"]");
					break;
			}
			
	}

	function setupMeshPosition(mesh,meshAary){
		mesh.rotateX( Math.PI / 180 * meshAary.get("rotate").x );
		mesh.rotateY( Math.PI / 180 * meshAary.get("rotate").y );
		mesh.rotateZ( Math.PI / 180 * meshAary.get("rotate").z );
		mesh.position.x = meshAary.get("position").x;
		mesh.position.y = meshAary.get("position").y;
		mesh.position.z = meshAary.get("position").z;
	}
    
    // MMD ここから
	function checkMMDModelLoaded(modelObjectKey){
		let tgt=modelObjects.get(modelObjectKey);
		//check model load
		if(!tgt.get("meshUuid")){
			myMMDDataLoader("PMX",modelObjectKey,null, function(mesh){
				let meshAary=modelObjects.get(modelObjectKey);
				
				setupMeshPosition(mesh,meshAary);
				
				mmd_helper.add(mesh);     //ここから物理演算適用開始
				
				//Mixer登録
				var mixer = new THREE.AnimationMixer(mesh);

				mmd_helper.objects.get(mesh).mixer=mixer;  // mesh.mixer=mixer;ではNGだった

				var mixer = getMixer(mmd_helper,mesh); //var mixer = mmd_helper.objects.get(mesh).mixer;
				initMixer(mixer);
				
				
				//シーンに追加
				scene.add(mesh);  // scene に追加登録する
				
				
				modelObjects.get(modelObjectKey).set("meshUuid" , mesh.uuid );
				checkMMDMotionLoaded(mesh,modelObjectKey);
			});
		}else{
		
			let baseposeId = tgt.get("basepose");
			let vpd = vpdObjects.get(baseposeId).get("vpdClip");
			let mesh = getMeshFromMmdHelper(tgt.get("meshUuid"))
			
			mmd_helper.pose(mesh, vpd );
			mesh.visible=true;

			checkMMDMotionLoaded(mesh,modelObjectKey);
		}
	}
	function checkMMDMotionLoaded(mesh,modelObjectKey){
		let tgt=modelObjects.get(modelObjectKey);
		if(tgt.get("motion")){
			let flg=1;
			let MotionObjects = tgt.get("MotionObjects");
			if(!MotionObjects){
				tgt.set("MotionObjects", new Map() );
			}else{
				if(MotionObjects.has(tgt.get("motion"))){
					let mo = MotionObjects.get(tgt.get("motion"));
					let uuid=mo.get("VmdClipUuid");
					if((uuid)&&(uuid != const_flgLoading)){
						flg=0;
					}
				}
			}
			if(flg){
				myMMDDataLoader("VMD",tgt.get("motion"),modelObjectKey, function(){
					afterMMDMotionLoaded(modelObjectKey,mesh);
				});
			}else{
				afterMMDMotionLoaded(modelObjectKey,mesh);
			}
		}else{ //次のモーション指定なし
			if(old_motionAction){if(old_motionAction!=""){
				let old_action = getVmdClipAction(modelObjectKey,old_motionAction);
				if(old_action){
					if(old_action.isRunning()){ 
						actionStart(modelObjectKey,old_motionAction ,0); //再生中のアクションを停止
					}else{
						old_action.fadeOut(0.5); //終了したアクションの最終ポーズを解除
					}
				}
				if(1==0){
					let tgt=modelObjects.get(modelObjectKey);
					let baseposeId = tgt.get("basepose");
					let vpd = vpdObjects.get(baseposeId).get("vpdClip");
					mmd_helper.pose(mesh, vpd );
				}
			}}
			checkMMDModelLoaded_end(modelObjectKey,mesh);
		}
	}
	function afterMMDMotionLoaded(modelObjectKey,mesh){
		

//	    if(loadedUuid==const_flgLoading){
//	        return 0;
//	    }
//	    if(loadedUuid==""){
//	        modelObjects.get(modelObjectKey).set("meshUuid" , const_flgLoading);
//	        mmdModelLoader(modelObjectKey ,  cbf  );
//	        myMMDDataLoader()
//	        let cbf = function(){
//	            meshModelSetup(modelObjectKey,MotionKey,motionStarttime)
//	        }
//	    }
	    
	    
	    let tgtMesh=modelObjects.get(modelObjectKey);
	    let MotionKey = tgtMesh.get("motion");
	    let motionStarttime = tgtMesh.get("motionStarttime");
	    if(!motionStarttime){ motionStarttime =0; }
	    let motionUpdatetime = tgtMesh.get("motionUpdatetime");
	    if(!motionUpdatetime){ motionUpdatetime = motionStarttime; }
	    
	    if(MotionKey!=""){
		    var action = getVmdClipAction(modelObjectKey,MotionKey);
		    if(action){
		    	let flg=1;
		    	
		    	if(old_motionAction){if(old_motionAction!=""){
					if(action.isRunning()){ 
						if(motionUpdatetime){
							if(old_motionActionUpdtT == motionUpdatetime){
								//既に同じアクションを再生中
								flg=0;
							}
						}
					}
					if(old_motionAction != MotionKey){
						let old_action = getVmdClipAction(modelObjectKey,old_motionAction);
						if(old_action.isRunning()){ 
							flg=1;
							if(flg){
								actionStart(modelObjectKey,old_motionAction ,0); //再生中の別アクションを停止
							}else{
								old_action.fadeOut(0.5); 
								(function(){
									let modelObjectKey0=modelObjectKey;
									let MotionKey0 = MotionKey;
									let motionStarttime0 = motionStarttime;
									setTimeout( function(){
										actionStart_trig(modelObjectKey0,MotionKey0, motionStarttime0);
									},2000 )
								});
							}
						}else{ //終了したアクションの最終ポーズを解除
							flg=1;
							if(flg){
								//old_action.fadeOut(0.5); 
								actionStart(modelObjectKey,old_motionAction ,0);
							}else{
								old_action.fadeOut(0.5); 
								(function(){
									let modelObjectKey0=modelObjectKey;
									let MotionKey0 = MotionKey;
									let motionStarttime0 = motionStarttime;
									setTimeout( function(){
										actionStart_trig(modelObjectKey0,MotionKey0, motionStarttime0);
									},2000 )
								});
							}
						}
					}
		    	}}


				if(flg){
					actionStart_trig(modelObjectKey,MotionKey, motionStarttime);
			    }
				function actionStart_trig(modelObjectKey,MotionKey, motionStarttime){
					tgtMesh.set("motionUpdatetime", motionStarttime );
			    	actionStart(modelObjectKey,MotionKey ,1  , motionStarttime,-30); //最後のパラメータは処理による遅延時間[ms]
			    }
		    }
		}
		checkMMDModelLoaded_end(modelObjectKey,mesh);
	}
	function checkMMDModelLoaded_end(modelObjectKey,mesh){
		if(mesh){
			checkMoveUpdate(modelObjectKey,mesh);
		}
	}
	// MMD ここまで
	
	
	//基本マテリアル
	function checkBasicMaterialExisted(modelObjectKey){
		let meshAary=modelObjects.get(modelObjectKey);
		//check model load
		if(meshAary.get("meshUuid")){
			//let mesh = getMeshFromMmdHelper(meshAary.get("meshUuid"));
			let mesh = getMeshFromScene(meshAary.get("meshUuid"));
			
			mesh.visible=true;
			
			afterGetBasicMaterialMesh(mesh,modelObjectKey);
			
		}else{
			let meshSourceAary = meshAary.get("meshSource");
			if(!meshSourceAary){
				console.log("not exist meshSource in ["+modelObjectKey+"]");
				checkBasicMaterialExisted_end(modelObjectKey,null);
			}
			
			// ジオメトリ作成
			let GeometryParameterAry = meshSourceAary.get("GeometryParameter");
			let GeometryType = meshSourceAary.get("GeometryType");
			let geometry = null;
			switch(GeometryType){
			 case "Sphere":
			 	geometry = new THREE.SphereGeometry(GeometryParameterAry[0],GeometryParameterAry[1],GeometryParameterAry[2]);
				break;
			 case "Torus":
			 	geometry = new THREE.TorusGeometry( GeometryParameterAry[0],GeometryParameterAry[1]
			 	                                   ,GeometryParameterAry[2],GeometryParameterAry[3] );
				break;
			 default: //BasicMaterial
				break;
			}
			if(!geometry){
				console.log("unknown GeometryType : ["+GeometryType+"]");
				checkBasicMaterialExisted_end(modelObjectKey,null);
			}
			
			// マテリアル作成
			let imgPath = meshSourceAary.get("TextureImage");
			if(loadedImgObjects.has(imgPath)){
				afterLoadImageTexture(loadedImgObjects.get(imgPath));
			}else{
				callOfLoadImage(imgPath);
				async function callOfLoadImage(path){
					onProgress = (xhr)=>{console.log(xhr.target.responseURL +' : downloaded '+ xhr.loaded +' / '+xhr.total );}
					onError = (xhr) => {console.log("ERROR "+ xhr.target.responseURL );}
					function LoadImage( path ){
					    return new Promise( (resolve, reject)=>{
							const loader = new THREE.TextureLoader();
							if (path && path!="") {
								let imgTexture = loader.load(path , (texture) => {
									resolve(imgTexture);
								}, onProgress, onError);
							} else {
								reject(false);
							}
						});
					}
					const imgTexture = await LoadImage(path);
					loadedImgObjects.set(path,imgTexture);
					afterLoadImageTexture(imgTexture);
				}
			}
			function afterLoadImageTexture(imgTexture){
				//create Material
				let MaterialParameterHary = meshSourceAary.get("MeshMaterialParameter");
				if(!MaterialParameterHary) MaterialParameterHary={};
				if(imgTexture){
					MaterialParameterHary["map"] = imgTexture;
				}
				let MaterialType = meshSourceAary.get("MeshMaterialType");
				let Material = null;
				switch(MaterialType){
				 case "Toon":
					Material = new THREE.MeshToonMaterial(MaterialParameterHary);
					break;
				 default: //Standard
					Material = new THREE.MeshStandardMaterial(MaterialParameterHary);
					break;
				}
				
				
				let mesh = new THREE.Mesh( geometry, Material );


				setupMeshPosition(mesh,meshAary);
				scene.add(mesh);  // scene に追加登録する

				meshAary.set("meshUuid" , mesh.uuid );
				
				afterGetBasicMaterialMesh(mesh,modelObjectKey);
			}


		}
	}
	function afterGetBasicMaterialMesh(mesh,modelObjectKey){
		checkBasicMaterialExisted_end(modelObjectKey,mesh);
	}
	
	function checkBasicMaterialExisted_end(modelObjectKey,mesh){
		if(mesh){
			checkMoveUpdate(modelObjectKey,mesh);
		}
	}
}







function checkMoveUpdate(modelObjectKey,mesh){
	
	let meshAary = modelObjects.get(modelObjectKey);

	if(!mesh){
		let meshUuid = meshAary.get("meshUuid");
		mesh = getMeshFromMmdHelper(meshUuid);
		if(!mesh) mesh = getMeshFromScene(meshUuid);
	}
	if(!mesh){
		return;
	}
	
	let moveID = meshAary.get("move");
	let moveStarttime = meshAary.get("moveStarttime");

	let params= meshAary.get("moveParameters");
	
	if(moveID){if(moveStarttime){
		setMovedata(modelObjectKey,mesh,moveID ,  params )
	}}
	
}






/* **********************************
 * Start Vmd and Audio.
 * And, Get Vmd Loop Event
 */

//  flg=True:開始、 false:停止
function actionStart(modelId,motionId,flg  , motionStarttime=0,motionStarttimeAudioDelay=0 ){    

  var action = getVmdClipAction(modelId,motionId);
  if(!action){
      return;
  }
  
  var MotionObject = modelObjects.get(modelId).get("MotionObjects").get(motionId);
  var loopFlg=MotionObject.get("VmdLoop");


  RenderReady = false;
  
  if(flg){
  
		if (!loopFlg) {   //animation Loop Once
			action.setLoop(THREE.LoopOnce); //2200
			action.repetitions = 0;
		}else{
			action.setLoop(THREE.LoopRepeat); //2201
		//action.repetitions = 0; // undefine = Infinity.
		}
		
		action.reset();
		action.paused=false;
		action.enabled=true;
		action.setEffectiveTimeScale(1);
		action.startAt=0;
		if(motionStarttime){action.time = (getNowTimeOnWorld() - motionStarttime)/1000;}

		action.weight=1;
		action.play();
		action.fadeIn(0.5);
		
		
		//  他アクション実行中だと、そのポーズが加算されてしまうことがあるらしい？
		//var aafdc = createAssociativeArrayForDelayChanges(action,"weight",0);

	  
	  
	  
		playSoundInClip(modelId,motionId , motionStarttime+motionStarttimeAudioDelay);
	  
	  
	  
		//setGuiCntl(motionId,action.weight);
	  
	  
  }else{
	action.fadeOut(0.5);	//  同時に他アクションfadeinを実行すると、今現在のポーズが加算されてしまうことがあるらしい？
				//他の処理候補
				//action.stopFading();
				//setTimeout( function(){action.stop()} ,1000);
				//action.stop();
	let k=0;
	if(k){
		let aafdc = createAssociativeArrayForDelayChanges(action,"weight",0);
		aafdc.f_spantime=500;
		animeDelayChanges.push( aafdc );
	}
	k=0;
	if(k){
		(function(){
			let action0=action;
			setTimeout( function(){
				action0.weight = 1;
				action0.stop();
			} , 500+100 );
		})
	}

	
	  
	  if(MotionObject.get("AudioClipId")!=""){
	    var AudioObject = modelObjects.get(modelId).get("AudioObjects").get(MotionObject.get("AudioClipId"));
	    if(AudioObject){
	      if(AudioObject.get("file_url")) { if(AudioObject.get("AudioClip")) {
	        var sound = AudioObject.get("AudioClip");
	        sound.stop();
	      
	        if(MotionObject.has("AudioClipReserve")){if(MotionObject.get("AudioClipReserve")){
	        	let timerObj = MotionObject.get("AudioClipReserve");
	        	clearTimeout(timerObj);
	        }}
	        MotionObject.delete("AudioClipReserve");
	        
	      
	      }}
	    }
	  }
	  
  }
  
  RenderReady = true;
  
  
}

function playSoundInClip(modelId , motionid, baseStarttimeOpt=null){ //baseStarttime[ms]
			   // MMD-Helperに音声を入れると、何故かモーションのループが効かなくなる
			   //   (あと、MMD-Helperにはaudioは1つしか追加できない）

	let modelMeshAary = modelObjects.get(modelId);
	
	let MotionObjects = modelMeshAary.get("MotionObjects");
	
	let parentObj = MotionObjects.get(motionid);
	if(!parentObj){
		console.log("not Found ID["+motionid+"]");
		return null;
	}

	let baseStarttime = 0
	if( typeof(baseStarttimeOpt) == "number"){
		baseStarttime = baseStarttimeOpt;
	}else{
		let motionStarttime = modelMeshAary.get("motionStarttime");
		if(typeof(motionStarttime) == "number"){ baseStarttime = motionStarttime; }
	}
	
	
	playSoundInTgtObj( modelId , parentObj , baseStarttime );
}


function playSoundInTgtObj(modelId , parentObj , baseStarttime ){
		//	let parentObjs =null; //Audioが付加されるobject

	let modelMeshAary = modelObjects.get(modelId);

	if(!parentObj){
		return null;
	}
	
    let AudioClipId = parentObj.get("AudioClipId");
    if(!AudioClipId || AudioClipId==""){
        return null;
    }
    
    
    let AudioObjects = modelMeshAary.get("AudioObjects");
    if(!AudioObjects){
    	modelObjects.get(modelId).set("AudioObjects" , new Map() ) 
    	AudioObjects = modelMeshAary.get("AudioObjects");
    }


	
	if(AudioObjects.has(AudioClipId)){
		callOfLoadAudio( AudioObjects.get(AudioClipId) ,baseStarttime)
	}else{
		console.log("not Found ID["+AudioClipId+"] in AudioObjects of ["+modelId+"].");
		requestEDI_AudioObj(AudioClipId,function(aary){
			if(aary){
				modifyUpdateAAry(AudioObjects,AudioClipId,aary);
				callOfLoadAudio( AudioObjects.get(AudioClipId) ,baseStarttime);
			}
		});
	}
	function callOfLoadAudio( AudioObject ,baseStarttime){
		if (AudioObject.get("file_url")) {
			if (AudioObject.get("AudioClip")) {
				AudioStartAfterLoad( AudioObject ,baseStarttime);
			}else{
				myMMDDataLoader("audio",AudioClipId,modelId , function(){
					AudioStartAfterLoad( AudioObject ,baseStarttime);
				});
			}
			
			
		}
	}
	
	
	function AudioStartAfterLoad( AudioObject , baseStarttime ){
		//let MotionObject = MotionObjects.get(motionid);
		//parentObj = parentObjs.get(parentObjId);
		
		          var sound = AudioObject.get("AudioClip");
		          sound.setLoop( false );
		          if(typeof(parentObj.get("audioVolume"))=="number"){ sound.setVolume(parentObj.get("audioVolume")); }
		          if(typeof(parentObj.get("audioSpeed"))=="number"){ sound.playbackRate=parentObj.get("audioSpeed"); }
		              
		          var ttldelay=parentObj.get("audioDelayTime");
		          let nowtime = getNowTimeOnWorld();
		          if(baseStarttime){ ttldelay += (baseStarttime-nowtime); }
		          if(ttldelay<=0){
		              if(sound.isPlaying){
		              sound.stop();
		              }
		              //sound.startTime= 0-ttldelay;
		              sound.offset= (0-ttldelay)/1000;
		              sound.play();
		          }else{
		              var tmpfnc=function(parentObj,sound,ttldelay){
		                var timerObj = setTimeout( 
		                    function(){
		                          parentObj.delete("AudioClipReserve");
		                          if(sound.isPlaying){  sound.stop(); }
		                          sound.play();
		                    }, ttldelay);
		                parentObj.set("AudioClipReserve",timerObj);
		              }
		              tmpfnc(parentObj,sound,ttldelay);
		          }
	}

}

function getVmdClipAction(modelId,motionid){

  var MotionObjects = modelObjects.get(modelId).get("MotionObjects");
  let meshUuid = modelObjects.get(modelId).get("meshUuid");
  
  if(!MotionObjects.has(motionid)){
    console.log("not Found ID["+motionid+"]");
    return null;
  }

  //var mesh = mmd_helper.meshes[ 0 ];  
  let mesh=getMeshFromMmdHelper(meshUuid);
  if(!mesh) { return null; }
  
  var mixer = getMixer(mmd_helper,mesh);
  var actionsForClip = mixer._actionsByClip[ MotionObjects.get(motionid).get("VmdClipUuid") ];
  //var action = mixer.existingAction(MotionObjects.get(keyid).VmdClip);
  var action =actionsForClip.actionByRoot[ mesh.uuid ] || null;
  
  
  
  
  if(!action){
      console.log("not Found action["+nameid+"]");
  }
  
  return action;
}


function getMeshFromMmdHelper(meshUuid){
  //var mesh = mmd_helper.meshes[ 0 ];  
  let mesh=0;
  for(let i=0;i<mmd_helper.meshes.length;i++){
      if(mmd_helper.meshes[i].uuid == meshUuid){
          mesh=mmd_helper.meshes[i];
          break;
      }
  }
  //if ( mmd_helper.meshes.indexOf( mesh ) == -1 ) { return null; }
  return mesh;
}

function getMeshFromScene(meshUuid){
  let mesh=0;
  for(let i=0;i<scene.children.length;i++){
      if(scene.children[i].uuid == meshUuid){
          mesh=scene.children[i];
          break;
      }
  }
  return mesh;
}











/* ********************************************************************
 * MMD Model Render
 * ******************************************************************** */
Render = () => {
	requestAnimationFrame(Render);

	if (RenderReady) {
	
	
	    mmd_helper.update(clock.getDelta());


	    
	    // 背景用カメラの方向を通常カメラに追従させる
	    camera_back.rotation.order = camera.rotation.order;
	    camera_back.rotation.x = camera.rotation.x;
	    camera_back.rotation.y = camera.rotation.y;
	    camera_back.rotation.z = camera.rotation.z;
	    camera_back.up.set( camera.up );
	    
	    //camera_back.position.set( camera.position.x, camera.position.y, camera.position.z );
	    

	    // レンダリング実行
	    renderer.clear(true,true,true); // autoClearを切っているため、明示的にクリアする
	    renderer.render(scene_back, camera_back); // 背景
	    effect.render( scene, camera  ,undefined,false ); // モデル (第4引数はレンダラクリア処理のOff)



	}



	if(myRenderActionEnable){
    	myRenderAction(clock.elapsedTime);
	}

}


function myRenderAction(nowclktime){

    
    //mousecontrols.target;
    meshMouseCntlTgt.position.set( mousecontrols.target.x,mousecontrols.target.y,mousecontrols.target.z );
    
    
    //animation
    let nowWorldTime = getNowTimeOnWorld();
    
    for(let i=animeDelayChanges.length-1;i>=0;i--){
        let aafdc = animeDelayChanges[i];
        let aafdcName = aafdc["name"];
        if(!aafdcName)aafdcName="";
        
        let nexttime = aafdc["nexttime"];
        if(!nexttime){ 
            aafdc["nexttime"] = nowWorldTime;
        }
        let mlt=0;
        while(nowWorldTime>=aafdc["nexttime"]){
            mlt+=1;
            if(aafdc["renderSpantime"]){
                aafdc["nexttime"] += aafdc["renderSpantime"];
            }else{
                aafdc["nexttime"] = nowWorldTime+1;
            }
        }
        if(mlt>0){
            let deleteFlg=0;
            
            let parentObj = aafdc["object"];
            let propertyname = aafdc["propertyname"];
            
            let myfunc = aafdc["calcFunction"];
            
            let deltatime=0
            
            if(parentObj && propertyname && myfunc && (parentObj[propertyname]) ){
	            let deltaFlg=0; // 1:未開始、2:終了
				if(nowWorldTime<aafdc.f_starttime){deltaFlg=1;}
				else{
					let elapsedTime = (nowWorldTime - aafdc.f_starttime);
					deltatime = elapsedTime % aafdc.f_spantime;
					let cnt = (elapsedTime / aafdc.f_spantime)|0;
					if(aafdc.f_elapsedloopcount != cnt){
						aafdc.f_elapsedloopcount = cnt;
						// console.log("loop ["+aafdcName+"]");
						
						
						
						let modelObjectKey = getKeyOfMeshFromUuid( aafdc.meshUuid );
						let mAary = modelObjects.get(modelObjectKey);
						if(mAary){
							let mpAarys = mAary.get("moveParameters");
							let mpAary = mpAarys.get( aafdc.propertyname );
							if(mpAary.has("AudioClipId")){
								let AudioId = mpAary.get("AudioClipId");
								if(AudioId){
									playSoundInTgtObj( modelObjectKey , mpAary , 0 );
								}
							}
						}
						
			
					}
					if(aafdc.f_loopcount){
						if(cnt>=aafdc.f_loopcount){
							deltaFlg=2;
						}
					}
				}
	            switch( deltaFlg ){
	            case 1:
	            	parentObj[propertyname] = aafdc.f_startvalue;
	            	break;
	            case 2:
	            	parentObj[propertyname] = aafdc.f_endvalue;
	            	deleteFlg=1; // 終了ムーブは削除
	            	break;
	            default:
	            	let newval = myfunc( deltatime/aafdc.f_spantime , aafdc , parentObj , propertyname );
	            	if(newval) parentObj[propertyname] = newval;
	            	break;
	            }
	        }else{
	        	deleteFlg=1;
	        }
            
            if(deleteFlg){
                animeDelayChanges.splice(i, 1); // ムーブを削除

                console.log("finished ["+aafdcName+"]");
            }
        }
        
    }
    
    
    
}
var animeDelayChanges=[];
//	"nexttime"
//	"renderSpantime"
//	"object"
//	"propertyname"
//	"calcFunction"

function createAssociativeArrayForDelayChanges(obj,propertyname  ,cfuncstr=null ){
    if(typeof obj === "undefined"){
        return false;
    }
    
    var nowval = obj[propertyname];
    //var delt = f_hAry.f_endvalue -nowval;
    
    var ans={};
    ans.object = obj;
    ans.propertyname = propertyname;
    ans.nexttime=0;
    
    let propFunc=null;
    if(cfuncstr){
        if(typeof(cfuncstr)=="function") {
            propFunc = cfuncstr; 
        }else if(typeof(cfuncstr)=="string"){
            eval( "propFunc="+cfuncstr );
        }
    }
    if(!propFunc){
    				propFunc = function(nowRate , f_hAry , parentObj , propertyName){
						let delta = (f_hAry.f_endvalue - f_hAry.f_startvalue) * nowRate;
						return (f_hAry.f_startvalue + delta);
					};
	}
    ans.calcFunction = propFunc;
    
    //初期値を仮設定する
    ans.renderSpantime=0;  // 変化頻度[ms]
    ans.f_spantime = 1000;
    ans.f_starttime = getNowTimeOnWorld();
    ans.f_startvalue = nowval;
    ans.f_endvalue = 0;
    ans.f_loopcount = 1;
    
    return ans;
}
//  sample //  function(nowtime, f_hAry{} )
//			var aafdc = createAssociativeArrayForDelayChanges(mesh.position,"y", f() ); //parentObject,targetProperty,ValueSet-func
//			f_hAry. { f_starttime,f_spantime,f_startvalue,f_endvalue,f_loopcount  ,  renderSpantime }
//			animeDelayChanges.push( aafdc );









function setMovedata(modelObjectKey,mesh,moveID , params ){
	let meshAary = modelObjects.get(modelObjectKey);
	if(!meshAary) return;
	let meshUuid = meshAary.get("meshUuid");
	if(!meshUuid) return;

	if(!moveID) return;
	if(moveID=="") return;

	let moveST = meshAary.get("moveStarttime");
	if(!moveST) moveST=getNowTimeOnWorld();
	let moveUT = meshAary.get("moveUpdatetime");
	if(!moveUT) moveUT=moveST;
	
	let moveExecuteFlgKeystr = moveID+":"+moveUT.toString();
	let moveExecuteFlg = meshAary.get("moveExecuteFlg");
	if(moveExecuteFlg){
		if(moveExecuteFlg == moveExecuteFlgKeystr){
			return; //既に処理
		}
	}
	
	
	
	//既登録 確認
	let oldmoves = animeDelayChanges.filter( function(aafdc){
		if(aafdc.meshUuid != meshUuid){ return false; }
		if(aafdc.moveID   != moveID  ){ return false; }
		return true;
	});
	if(oldmoves.length!=0){
	    if(moveUT == oldmoves.f_starttime){
			return; // 既にロード済み(処理中)
		}else{ //内容に変更あり？
		}
	}
	
	
	
	//現在の処理を削除
	for(let i=animeDelayChanges.length-1;i>=0;i--){
		let aafdc=animeDelayChanges[i];
		if(aafdc.meshUuid == meshUuid){
			animeDelayChanges.splice(i, 1); // ムーブを削除
		}
	}
	meshAary.set("moveExecuteFlg",moveExecuteFlgKeystr);
	
	//登録処理
	if(!mesh){
		mesh = getMeshFromMmdHelper(meshUuid);
		if(!mesh){
			mesh = getMeshFromScene(meshUuid);
		} return;
		if(!mesh){ return; }
	}
	

	let mpArys = meshAary.get("moveParameters");
	
	
	
	let loopCount = 0;
	
	let newMovePattern = null;
	if(moveID=="default"){
		newMovePattern = new Map([
			["name","default"]
		]);
		afterGetMovePattern();
	}else{
		if(loadedMoveObjects.has(moveID)){
			newMovePattern = loadedMoveObjects.get(moveID);
			afterGetMovePattern();
		}else{
			requestEDI_moveObj(moveID , function(aary){
				newMovePattern = aary;
				if(!aary.get("onceOnlyFlg")){ loadedMoveObjects.set(moveID,aary); }
				afterGetMovePattern();
			})
		}
	}

	function afterGetMovePattern(){
		if(!newMovePattern){ return; }
		
		loopCount = newMovePattern.get("movLoop");
		if(!loopCount) loopCount=1;
		
		mpArys.forEach(function(value, key){
			let properties= newMovePattern.get("properties");
			if(!properties){
				return;
			}else{
				let ptnAry = properties.get(key);
				if(!ptnAry){
					if(value.has("targerPropertyTreePath")){
						ptnAry=new Map([ ["targerPropertyTreePath", value.get("targerPropertyTreePath") ] ]);
					}else{
						return;
					}
				}
				setMovedataOfOneProperty(mesh , value   ,  ptnAry  );
			}
		});
		
		
	}
	function setMovedataOfOneProperty(mesh  , mpAry , pAary){
		let treePathAry = pAary.get("targerPropertyTreePath");
		let msg ="";
		let tgtobj = mesh;
		let parentobj = null;
		for(let i=0;i<treePathAry.length;i++){
			msg+=(" - "+treePathAry[i]);
			if(tgtobj[treePathAry[i]]){
				parentobj = tgtobj;
				tgtobj = tgtobj[treePathAry[i]];
			}else{
				console.log("not Found Mesh-Property ["+msg+"]");
				tgtobj=null;
				break;
			}
		}
		if(tgtobj){if(parentobj){
			let propertyName = treePathAry[treePathAry.length-1];
			let propFuncStr = pAary.get("calcFunction");

			let aafdc = createAssociativeArrayForDelayChanges( parentobj , propertyName , propFuncStr );
			//管理用パラメータ
			aafdc.meshUuid=mesh.uuid;
			aafdc.moveID=moveID;
			aafdc.updatetime = moveUT;
			aafdc.f_elapsedloopcount=0;

			//制御用パラメータ
			aafdc.f_starttime = moveST;
			if(loopCount) aafdc.f_loopcount = loopCount;
			mpAry.forEach(function(value, key){
				if(key.substring(0,2)=="f_"){
					aafdc[key] = value;
				}
			});
			if(!aafdc.f_spantime) { aafdc.f_spantime=1000; } //ms 
			if(!aafdc.f_endvalue && aafdc.f_endvalue !=0 ) { aafdc.f_endvalue = aafdc.f_startvalue; } 
			animeDelayChanges.push( aafdc );
			
			
			//音源管理
			if(mpAry.has("AudioClipId")){
				let AudioId = mpAry.get("AudioClipId");
				if(AudioId){
					playSoundInTgtObj( modelObjectKey , mpAry , 0 );
				}
			}
		}}
		
		
		
	}
	
}
























// ** for GUI **

	// チェックボックス 値格納用オブジェクト
	let gui_checkbox_api = {};

	//Volume値格納用オブジェクトを作成する
	let gui_volume_api = null;

// ** for GUI **


function initGui() {
    gui = new dat.GUI();
    
    let foldername="action";
    let folder1 = gui.addFolder(foldername);

	let key="All";
	gui_checkbox_api[key]=true; //初期値
	folder1.add( gui_checkbox_api, key ).onChange( function () {
		let key = this.property;
		
		let tgt ="motion";
		gui_checkbox_api[tgt]=gui_checkbox_api[key];
		updateGuiCntl("action",tgt);
		executeOnchangeGuiCntl("action",tgt)
		
		tgt ="move";
		gui_checkbox_api[tgt]=gui_checkbox_api[key];
		updateGuiCntl("action",tgt);
		executeOnchangeGuiCntl("action",tgt)
	});
	
	
	key="motion";	
	gui_checkbox_api[key]=true; //初期値
	folder1.add( gui_checkbox_api, key ).onChange( function () {
		let key = this.property;
			//mesh.mixer.stopAllAction();
	    mmd_helper.enable( 'animation', gui_checkbox_api[key] );
	    
	    if(modelObjects.has("miku01")){
	    	let tgtMesh = modelObjects.get("miku01")
	    	if(tgtMesh.has("MotionObjects")){
			    let MotionObjects = tgtMesh.get("MotionObjects");
			    //Audio
				for(var obj of MotionObjects.values()){
					if (obj.get("file_url")) { if (obj.get("AudioClip")) {
						var sound = obj.get("AudioClip");
						
						if(gui_checkbox_api[key]){
							if(sound.offset != 0){ //０でないならpauseされていると判断
								sound.play();
							}
						}else{
							sound.pause();
						}
						
					}}
				};
			}
		}

	    
		//dispmsg();
	} );
	
	key = "move";
	gui_checkbox_api[key]=myRenderActionEnable; //初期値
	folder1.add( gui_checkbox_api, key ).onChange( function () {
		let key = this.property;
		myRenderActionEnable = gui_checkbox_api[key];
	});


	
	key = "test01";
	gui_checkbox_api[key]=false; //初期値
	folder1.add( gui_checkbox_api, key ).onChange( function () {
		let key = this.property;
		dummyStarttime2 = getNowTimeOnWorld();
		//myTestEdi();
		meshModelSetup("test");
	});
	key = "test02";
	gui_checkbox_api[key]=false; //初期値
	folder1.add( gui_checkbox_api, key ).onChange( function () {
		let key = this.property;
		dummyStarttime2 = getNowTimeOnWorld();
		//myTestEdi();
		meshModelSetup("test");
	});



    foldername = 'adjuster';
    var folder2 = gui.addFolder(foldername);

	let volumeApi = function(){
		this["keys"] = ["neck_horizontal","neck_vertical"];
		// volumeApiの初期値を設定
		this["keys"].map( key =>{
			this[key] = 0;
		});
	};
	gui_volume_api = new volumeApi();
	



    //volumeApi[actionCode]
    //     folder2.add(  new volumeApi()   ,  key  ,   min,max,step  )
    gui_volume_api["keys"].map(key =>{
        folder2.add( gui_volume_api, key , -1,1 ,0.01 ).onChange( function(){
        	//changeWeight(key);
        })
    });
    
    
    
//	function changeWeight(actionCode){
//	       var action = getVmdClipAction("miku01",actionCode);
//	       if(action){
//	           action.weight = gui_volume_api[actionCode];
//	       }
//	}



}


//ユーザー操作ではなく、Prg側パラメータでGUIを変化させる例
function setGuiCntl_volume(foldername,key,val0){
    if(!gui_volume_api[key]){ return; }
    
    var val=val0;
    if(val>1)val=1;
    if(val<0)val=0;
    
    gui_volume_api[key]=val;
    
    updateGuiCntl(foldername,key);
}
function updateGuiCntl(foldername,key){
    var fold = gui.__folders[foldername];
    if(fold){
        var tgtCntl = (fold.__controllers).filter(ctrl => ctrl.property==key);
        if(tgtCntl.length ==1){
            tgtCntl[0].updateDisplay();
        }
    }
}
function executeOnchangeGuiCntl(foldername,key){
    var fold = gui.__folders[foldername];
    if(fold){
        var tgtCntl = (fold.__controllers).filter(ctrl => ctrl.property==key);
        if(tgtCntl.length ==1){
            tgtCntl[0].__onChange();
        }
    }
}







//  以下、実験用

function myCheckActionCount(){
    dummyMySwitch++;
    
    let msg = dummyMySwitch.toString();
    
    var tgtelemOut=document.getElementById("myActionCount");
    if(tgtelemOut){
        tgtelemOut.innerHTML = msg;
    }
    
    myTestEdi();
}
function myRepeat(){
    dummyStarttime1 = getNowTimeOnWorld();
}



function myTestEdi(){
	console.log("start : myTest" );
	
    callEdiForUpdate();

}


