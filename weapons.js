// =============================================
// WEAPONS SYSTEM
// =============================================

const WEAPONS = {
  knife: {
    name: 'Couteau', damage: 4, ammoMax: 0, reloadTime: 0,
    fireRate: 800, range: 2.5, spread: 0, pellets: 1,
    isMelee: true, bulletSpeed: 0, bulletColor: 0xffffff,
    model: buildKnifeModel, slot: 1,
  },
  pistol: {
    name: 'Pistolet', damage: 1, ammoMax: 30, reloadTime: 1500,
    fireRate: 300, range: 100, spread: 0.01, pellets: 1,
    isMelee: false, bulletSpeed: 60, bulletColor: 0xffee00,
    model: buildPistolModel, slot: 2,
  },
  shotgun: {
    name: 'Shotgun', damage: 3, ammoMax: 8, reloadTime: 800,
    fireRate: 900, range: 20, spread: 0.08, pellets: 6,
    isMelee: false, bulletSpeed: 50, bulletColor: 0xff6600,
    model: buildShotgunModel, slot: 3,
  },
  smg: {
    name: 'Mitraillette', damage: 0.5, ammoMax: 60, reloadTime: 2000,
    fireRate: 80, range: 60, spread: 0.04, pellets: 1,
    isMelee: false, bulletSpeed: 70, bulletColor: 0x00ffff,
    model: buildSMGModel, slot: 4,
  }
};

// =============================================
// INVENTORY — reset à chaque chargement de page
// =============================================
// owned[id] = true si l'arme est débloquée
// ammoInMag[id] = balles dans le chargeur actuel
// extraMags[id] = nombre de chargeurs en réserve
const owned    = { knife: true,  pistol: false, shotgun: false, smg: false };
const ammoInMag = { knife: 0,    pistol: 0,     shotgun: 0,     smg: 0     };
const extraMags = { knife: 0,    pistol: 0,     shotgun: 0,     smg: 0     };

let currentWeapon    = 'knife';
let lastFireTime     = 0;
let isReloadingWeapon = false;
let autoFireInterval  = null;

// =============================================
// 3D MODELS
// =============================================
function clearWeaponModel(group) {
  while(group.children.length) group.remove(group.children[0]);
}

function buildKnifeModel(group) {
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015,0.02,0.28), new THREE.MeshLambertMaterial({color:0xcccccc}));
  blade.position.set(0,0.01,-0.28); group.add(blade);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.015,0.015), new THREE.MeshLambertMaterial({color:0x888888}));
  guard.position.set(0,0,-0.12); group.add(guard);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.03,0.12), new THREE.MeshLambertMaterial({color:0x3a2010}));
  handle.position.set(0,-0.01,-0.04); group.add(handle);
  group.position.set(0.18,-0.16,-0.3); group.rotation.set(0.1,0,0.3);
}

function buildPistolModel(group) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.4), new THREE.MeshLambertMaterial({color:0x222222}));
  body.position.set(0,0,-0.2); group.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.35,8), new THREE.MeshLambertMaterial({color:0x111111}));
  barrel.rotation.x=Math.PI/2; barrel.position.set(0,0.02,-0.38); group.add(barrel);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.12,0.06), new THREE.MeshLambertMaterial({color:0x3a2a1a}));
  handle.position.set(0,-0.09,-0.1); group.add(handle);
  group.position.set(0.22,-0.18,-0.4); group.rotation.set(0,0,0);
}

function buildShotgunModel(group) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,0.65), new THREE.MeshLambertMaterial({color:0x5C3A1E}));
  body.position.set(0,0,-0.28); group.add(body);
  [[-0.025],[0.025]].forEach(([ox]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.55,8), new THREE.MeshLambertMaterial({color:0x111111}));
    b.rotation.x=Math.PI/2; b.position.set(ox,0.02,-0.5); group.add(b);
  });
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.09,0.22), new THREE.MeshLambertMaterial({color:0x3a2010}));
  stock.position.set(0,-0.02,0.06); group.add(stock);
  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.055,0.15), new THREE.MeshLambertMaterial({color:0x8B6914}));
  pump.position.set(0,-0.01,-0.35); group.add(pump);
  group.position.set(0.2,-0.2,-0.5); group.rotation.set(0,0,0);
}

function buildSMGModel(group) {
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,0.35), new THREE.MeshLambertMaterial({color:0x1a1a2e}));
  body.position.set(0,0,-0.15); group.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.25,8), new THREE.MeshLambertMaterial({color:0x111111}));
  barrel.rotation.x=Math.PI/2; barrel.position.set(0,0.02,-0.35); group.add(barrel);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045,0.18,0.05), new THREE.MeshLambertMaterial({color:0x333333}));
  mag.position.set(0,-0.1,-0.12); group.add(mag);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.09,0.05), new THREE.MeshLambertMaterial({color:0x222222}));
  handle.position.set(0,-0.08,0.02); group.add(handle);
  // Viseur carré vert distinctif
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.028,0.028,0.01), new THREE.MeshBasicMaterial({color:0x00ff44}));
  sight.position.set(0,0.065,-0.2); group.add(sight);
  const sightPost = new THREE.Mesh(new THREE.BoxGeometry(0.008,0.035,0.008), new THREE.MeshBasicMaterial({color:0x00aa33}));
  sightPost.position.set(0,0.042,-0.2); group.add(sightPost);
  group.position.set(0.2,-0.18,-0.38); group.rotation.set(0,0,0);
}

// =============================================
// HUD
// =============================================
function updateWeaponHUD(updateAmmoHUD) {
  const w = WEAPONS[currentWeapon];
  if(w.isMelee) {
    updateAmmoHUD('⚔', '—', w.name, 0, 0);
  } else {
    updateAmmoHUD(ammoInMag[currentWeapon], w.ammoMax, w.name, extraMags[currentWeapon]);
  }
}

// =============================================
// SWITCH
// =============================================
function switchWeapon(id, weaponGroup, camera, scene, updateAmmoHUD) {
  if(!(id in WEAPONS)) return;
  if(!owned[id]) return;          // arme non débloquée
  if(isReloadingWeapon) return;
  if(autoFireInterval) { clearInterval(autoFireInterval); autoFireInterval = null; }
  currentWeapon = id;
  clearWeaponModel(weaponGroup);
  WEAPONS[id].model(weaponGroup);
  updateWeaponHUD(updateAmmoHUD);
}

// =============================================
// PICKUP LOGIC
// =============================================
const PICKUP_POSITIONS = [
  {x:-17,z:0},{x:17,z:0},{x:0,z:-20},{x:0,z:22},
  {x:-9,z:-9},{x:9,z:-9},{x:0,z:24},{x:16,z:14},{x:-16,z:14}
];
const PICKUP_WEAPONS = ['pistol','shotgun','smg'];
const activePickups = [];

function spawnWeaponPickups(scene) {
  const colors = { pistol:0xf39c12, shotgun:0x8B6914, smg:0x0066cc };
  // Assign random weapon to each position
  const positions = [...PICKUP_POSITIONS].sort(()=>Math.random()-0.5);
  positions.forEach((pos) => {
    const wid = PICKUP_WEAPONS[Math.floor(Math.random()*PICKUP_WEAPONS.length)];
    const col = colors[wid];
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.4,0.4,0.4),
      new THREE.MeshLambertMaterial({color:col, emissive:col, emissiveIntensity:0.4})
    );
    box.position.set(pos.x, 0.6, pos.z); scene.add(box);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.3,0.04,8,16),
      new THREE.MeshBasicMaterial({color:col})
    );
    ring.position.set(pos.x,0.6,pos.z); ring.rotation.x=Math.PI/2; scene.add(ring);
    activePickups.push({box, ring, weapon:wid, x:pos.x, z:pos.z, active:true});
  });
}

function updatePickups(dt, camera, scene, switchWeaponFn, updateAmmoHUD, showPickupMsg) {
  for(const p of activePickups) {
    if(!p.active) continue;
    p.box.rotation.y += dt*1.5;
    p.ring.rotation.z += dt*1.0;
    const bob = 0.6 + Math.sin(Date.now()*0.002)*0.1;
    p.box.position.y = bob; p.ring.position.y = bob;

    const dx = camera.position.x - p.x;
    const dz = camera.position.z - p.z;
    if(Math.sqrt(dx*dx+dz*dz) < 1.2) {
      p.active = false; p.box.visible = false; p.ring.visible = false;

      const wid = p.weapon;
      const w   = WEAPONS[wid];

      if(!owned[wid]) {
        // Nouvelle arme — débloque + 1 chargeur plein
        owned[wid]     = true;
        ammoInMag[wid] = w.ammoMax;
        extraMags[wid] = 0;
        showPickupMsg(`🔫 ${w.name} obtenu !`);
        switchWeaponFn(wid);
      } else {
        // Arme déjà possédée — +1 chargeur en réserve
        extraMags[wid]++;
        showPickupMsg(`📦 +1 chargeur ${w.name} (${extraMags[wid]} en réserve)`);
      }
      updateWeaponHUD(updateAmmoHUD);

      // Réapparition après 20s
      setTimeout(()=>{ p.active=true; p.box.visible=true; p.ring.visible=true; }, 20000);
    }
  }
}

// =============================================
// FIRE
// =============================================
function canFire() {
  const w = WEAPONS[currentWeapon];
  if(isReloadingWeapon) return false;
  if(!w.isMelee && ammoInMag[currentWeapon] <= 0) return false;
  if(Date.now()-lastFireTime < w.fireRate) return false;
  return true;
}

function fireWeapon(scene, camera, pitch, yaw, walls, remotePlayers, bullets, ws,
                    spawnImpact, showMuzzleFlash, showHitMarker, weaponGroup, updateAmmoHUD) {
  if(!canFire()) {
    // Tenter rechargement si chargeur vide et réserve disponible
    if(!WEAPONS[currentWeapon].isMelee && ammoInMag[currentWeapon]<=0 && extraMags[currentWeapon]>0)
      startWeaponReload(updateAmmoHUD);
    return;
  }
  const w = WEAPONS[currentWeapon];
  lastFireTime = Date.now();
  weaponGroup.position.z += 0.05;
  setTimeout(()=>{ weaponGroup.position.z -= 0.05; }, 80);
  showMuzzleFlash();

  if(w.isMelee) {
    const dir = new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
    const ray = new THREE.Raycaster(camera.position.clone(), dir.normalize(), 0, w.range);
    for(const [pid,pObj] of Object.entries(remotePlayers)) {
      if(!pObj.alive) continue;
      if(ray.intersectObject(pObj.group,true).length>0) {
        if(ws&&ws.readyState===1) ws.send(JSON.stringify({type:'hit',targetId:pid,damage:w.damage}));
        showHitMarker();
        weaponGroup.rotation.z -= 0.5;
        setTimeout(()=>{ weaponGroup.rotation.z += 0.5; },150);
        break;
      }
    }
    return;
  }

  // Ranged
  ammoInMag[currentWeapon]--;
  updateWeaponHUD(updateAmmoHUD);

  for(let p=0; p<w.pellets; p++) {
    const sx=(Math.random()-0.5)*w.spread, sy=(Math.random()-0.5)*w.spread;
    const dir=new THREE.Vector3(sx,sy,-1).applyEuler(new THREE.Euler(pitch,yaw,0,'YXZ')).normalize();
    const origin=camera.position.clone().add(new THREE.Vector3(0,-0.05,0));
    const bMesh=new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6),new THREE.MeshBasicMaterial({color:w.bulletColor}));
    bMesh.position.copy(origin); scene.add(bMesh);
    bullets.push({mesh:bMesh,pos:origin.clone(),dir:dir.clone(),speed:w.bulletSpeed,life:w.range/w.bulletSpeed});
    const ray=new THREE.Raycaster(origin,dir.clone(),0,w.range);
    const wh=ray.intersectObjects(walls.map(ww=>ww.mesh));
    if(wh.length>0) setTimeout(()=>spawnImpact(wh[0].point,wh[0].face?wh[0].face.normal:new THREE.Vector3(0,1,0)),30);
    if(p===0) {
      for(const [pid,pObj] of Object.entries(remotePlayers)) {
        if(!pObj.alive) continue;
        if(ray.intersectObject(pObj.group,true).length>0) {
          if(ws&&ws.readyState===1) ws.send(JSON.stringify({type:'hit',targetId:pid,damage:w.damage}));
          showHitMarker(); break;
        }
      }
    }
  }
  const dir0=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
  const o0=camera.position.clone();
  if(ws&&ws.readyState===1) ws.send(JSON.stringify({type:'shoot',origin:{x:o0.x,y:o0.y,z:o0.z},direction:{x:dir0.x,y:dir0.y,z:dir0.z}}));

  // Auto reload si chargeur vide et réserve dispo
  if(ammoInMag[currentWeapon]<=0 && extraMags[currentWeapon]>0) startWeaponReload(updateAmmoHUD);
}

// =============================================
// RELOAD — consomme 1 chargeur de réserve
// =============================================
function startWeaponReload(updateAmmoHUD) {
  const w = WEAPONS[currentWeapon];
  if(w.isMelee || isReloadingWeapon) return;
  if(ammoInMag[currentWeapon] >= w.ammoMax) return;
  if(extraMags[currentWeapon] <= 0) return; // pas de chargeur disponible

  isReloadingWeapon = true;
  extraMags[currentWeapon]--;

  const bar=document.getElementById('reload-bar');
  const fill=document.getElementById('reload-fill');
  const txt=document.getElementById('reloading-text');
  bar.style.display='block'; txt.style.display='block';
  fill.style.transition='none'; fill.style.width='0%';
  setTimeout(()=>{ fill.style.transition=`width ${w.reloadTime}ms linear`; fill.style.width='100%'; },20);
  setTimeout(()=>{
    ammoInMag[currentWeapon] = w.ammoMax;
    isReloadingWeapon = false;
    bar.style.display='none'; txt.style.display='none'; fill.style.width='0%';
    updateWeaponHUD(updateAmmoHUD);
  }, w.reloadTime);
}

// =============================================
// MINIMAP
// =============================================
function drawPickupsOnMinimap(mmCtx, worldToMM) {
  const colors = { pistol:'#f39c12', shotgun:'#e67e22', smg:'#3498db' };
  for(const p of activePickups) {
    if(!p.active) continue;
    const {mx,my} = worldToMM(p.x, p.z);
    mmCtx.save();
    mmCtx.translate(mx,my); mmCtx.rotate(Math.PI/4);
    mmCtx.fillStyle = colors[p.weapon]||'#fff';
    mmCtx.fillRect(-3,-3,6,6);
    mmCtx.restore();
  }
}
