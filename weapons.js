// =============================================
// WEAPONS SYSTEM
// =============================================

const WEAPONS = {
  knife: {
    name: 'Couteau',
    damage: 4,         // 4 coeurs d'un coup
    ammoMax: 1,        // pas de munitions (corps à corps)
    reloadTime: 0,
    fireRate: 800,     // ms entre chaque coup
    range: 2.5,        // portée courte (corps à corps)
    spread: 0,
    pellets: 1,
    isMelee: true,
    bulletSpeed: 0,
    bulletColor: 0xffffff,
    model: buildKnifeModel,
    switchKey: '&',    // touche 1 AZERTY
    slot: 1,
  },
  pistol: {
    name: 'Pistolet',
    damage: 1,
    ammoMax: 30,
    reloadTime: 1500,
    fireRate: 300,
    range: 100,
    spread: 0.01,
    pellets: 1,
    isMelee: false,
    bulletSpeed: 60,
    bulletColor: 0xffee00,
    model: buildPistolModel,
    switchKey: 'é',    // touche 2 AZERTY
    slot: 2,
  },
  shotgun: {
    name: 'Shotgun',
    damage: 3,         // 3 coeurs par tir (1 pellet, recharge entre chaque coup)
    ammoMax: 8,
    reloadTime: 800,   // recharge rapide entre chaque coup
    fireRate: 900,
    range: 20,
    spread: 0.08,
    pellets: 6,        // 6 pellets mais 1 seul suffit pour les dégâts
    isMelee: false,
    bulletSpeed: 50,
    bulletColor: 0xff6600,
    model: buildShotgunModel,
    switchKey: '"',    // touche 3 AZERTY
    slot: 3,
  },
  smg: {
    name: 'Mitraillette',
    damage: 0.5,       // 1/2 coeur par balle
    ammoMax: 60,       // double du pistolet
    reloadTime: 2000,
    fireRate: 80,      // très rapide
    range: 60,
    spread: 0.04,
    pellets: 1,
    isMelee: false,
    bulletSpeed: 70,
    bulletColor: 0x00ffff,
    model: buildSMGModel,
    switchKey: "'",    // touche 4 AZERTY
    slot: 4,
  }
};

// Current weapon state
let currentWeapon = 'knife';
let weaponAmmo = { knife:1, pistol:30, shotgun:8, smg:60 };
let lastFireTime = 0;
let isReloadingWeapon = false;
let autoFireInterval = null;

// =============================================
// WEAPON 3D MODELS
// =============================================

function clearWeaponModel(group) {
  while(group.children.length > 0) group.remove(group.children[0]);
}

function buildKnifeModel(group) {
  // Blade
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.02, 0.28),
    new THREE.MeshLambertMaterial({color: 0xcccccc})
  );
  blade.position.set(0, 0.01, -0.28);
  group.add(blade);
  // Guard
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.015, 0.015),
    new THREE.MeshLambertMaterial({color: 0x888888})
  );
  guard.position.set(0, 0, -0.12);
  group.add(guard);
  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.03, 0.12),
    new THREE.MeshLambertMaterial({color: 0x3a2010})
  );
  handle.position.set(0, -0.01, -0.04);
  group.add(handle);
  group.position.set(0.18, -0.16, -0.3);
  group.rotation.set(0.1, 0, 0.3);
}

function buildPistolModel(group) {
  const gunBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.08,0.08,0.4),
    new THREE.MeshLambertMaterial({color:0x222222})
  );
  gunBody.position.set(0,0,-0.2); group.add(gunBody);
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018,0.018,0.35,8),
    new THREE.MeshLambertMaterial({color:0x111111})
  );
  barrel.rotation.x=Math.PI/2; barrel.position.set(0,0.02,-0.38); group.add(barrel);
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.06,0.12,0.06),
    new THREE.MeshLambertMaterial({color:0x3a2a1a})
  );
  handle.position.set(0,-0.09,-0.1); group.add(handle);
  const guard = new THREE.Mesh(
    new THREE.TorusGeometry(0.03,0.008,6,8,Math.PI),
    new THREE.MeshLambertMaterial({color:0x222222})
  );
  guard.rotation.x=Math.PI; guard.position.set(0,-0.04,-0.12); group.add(guard);
  group.position.set(0.22,-0.18,-0.4);
  group.rotation.set(0,0,0);
}

function buildShotgunModel(group) {
  // Long body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.07, 0.65),
    new THREE.MeshLambertMaterial({color: 0x5C3A1E})
  );
  body.position.set(0, 0, -0.28); group.add(body);
  // Double barrel
  const b1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016,0.016,0.55,8),
    new THREE.MeshLambertMaterial({color: 0x111111})
  );
  b1.rotation.x=Math.PI/2; b1.position.set(-0.025,0.02,-0.5); group.add(b1);
  const b2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016,0.016,0.55,8),
    new THREE.MeshLambertMaterial({color: 0x111111})
  );
  b2.rotation.x=Math.PI/2; b2.position.set(0.025,0.02,-0.5); group.add(b2);
  // Stock
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.07,0.09,0.22),
    new THREE.MeshLambertMaterial({color: 0x3a2010})
  );
  stock.position.set(0,-0.02,0.06); group.add(stock);
  // Pump
  const pump = new THREE.Mesh(
    new THREE.BoxGeometry(0.08,0.055,0.15),
    new THREE.MeshLambertMaterial({color: 0x8B6914})
  );
  pump.position.set(0,-0.01,-0.35); group.add(pump);
  group.position.set(0.2,-0.2,-0.5);
  group.rotation.set(0,0,0);
}

function buildSMGModel(group) {
  // Compact body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.07,0.07,0.35),
    new THREE.MeshLambertMaterial({color: 0x1a1a2e})
  );
  body.position.set(0,0,-0.15); group.add(body);
  // Short barrel
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014,0.014,0.25,8),
    new THREE.MeshLambertMaterial({color: 0x111111})
  );
  barrel.rotation.x=Math.PI/2; barrel.position.set(0,0.02,-0.35); group.add(barrel);
  // Magazine (vertical)
  const mag = new THREE.Mesh(
    new THREE.BoxGeometry(0.045,0.18,0.05),
    new THREE.MeshLambertMaterial({color: 0x333333})
  );
  mag.position.set(0,-0.1,-0.12); group.add(mag);
  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05,0.09,0.05),
    new THREE.MeshLambertMaterial({color: 0x222222})
  );
  handle.position.set(0,-0.08,0.02); group.add(handle);
  // Sight
  const sight = new THREE.Mesh(
    new THREE.BoxGeometry(0.01,0.025,0.01),
    new THREE.MeshLambertMaterial({color: 0xff0000})
  );
  sight.position.set(0,0.055,-0.2); group.add(sight);
  group.position.set(0.2,-0.18,-0.38);
  group.rotation.set(0,0,0);
}

// =============================================
// WEAPON SWITCH
// =============================================

function switchWeapon(id, weaponGroup, camera, scene, updateAmmoHUD) {
  if(!(id in WEAPONS)) return;
  if(isReloadingWeapon) return;
  if(autoFireInterval) { clearInterval(autoFireInterval); autoFireInterval = null; }

  currentWeapon = id;
  clearWeaponModel(weaponGroup);
  WEAPONS[id].model(weaponGroup);

  updateWeaponHUD(updateAmmoHUD);
  console.log(`Switched to: ${WEAPONS[id].name}`);
}

function updateWeaponHUD(updateAmmoHUD) {
  const w = WEAPONS[currentWeapon];
  if(w.isMelee) {
    updateAmmoHUD('∞', '—', w.name);
  } else {
    updateAmmoHUD(weaponAmmo[currentWeapon], w.ammoMax, w.name);
  }
}

// =============================================
// WEAPON PICKUP SPAWNS ON MAP
// =============================================

const WEAPON_SPAWNS = [
  { weapon: 'shotgun', x: -17, z: 0  },
  { weapon: 'shotgun', x: 17,  z: 0  },
  { weapon: 'smg',     x: 0,   z: -20},
  { weapon: 'smg',     x: 0,   z: 22 },
  { weapon: 'pistol',  x: -9,  z: -9 },
  { weapon: 'pistol',  x: 9,   z: -9 },
  { weapon: 'pistol',  x: 0,   z: 24 },
];

const activePickups = []; // { mesh, weapon, x, z, active }

function spawnWeaponPickups(scene) {
  // Shuffle and pick random positions
  const shuffled = WEAPON_SPAWNS.sort(() => Math.random() - 0.5);

  for(const sp of shuffled) {
    const w = WEAPONS[sp.weapon];
    const colors = { shotgun:0x8B6914, smg:0x0066cc, pistol:0xf39c12 };

    // Floating box pickup
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.MeshLambertMaterial({ color: colors[sp.weapon] || 0xffffff, emissive: colors[sp.weapon], emissiveIntensity: 0.3 })
    );
    box.position.set(sp.x, 0.6, sp.z);
    scene.add(box);

    // Letter label (floating ring)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.04, 8, 16),
      new THREE.MeshBasicMaterial({ color: colors[sp.weapon] || 0xffffff })
    );
    ring.position.set(sp.x, 0.6, sp.z);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    activePickups.push({ box, ring, weapon: sp.weapon, x: sp.x, z: sp.z, active: true });
  }
}

function updatePickups(dt, camera, scene, switchWeaponFn) {
  for(const p of activePickups) {
    if(!p.active) continue;
    // Rotate
    p.box.rotation.y += dt * 1.5;
    p.ring.rotation.z += dt * 1.0;
    // Bob up/down
    p.box.position.y = 0.6 + Math.sin(Date.now() * 0.002) * 0.1;
    p.ring.position.y = p.box.position.y;

    // Check if player is close enough to pick up
    const dx = camera.position.x - p.x;
    const dz = camera.position.z - p.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if(dist < 1.2) {
      // Pick up!
      p.active = false;
      p.box.visible = false;
      p.ring.visible = false;
      switchWeaponFn(p.weapon);
      // Refill ammo
      weaponAmmo[p.weapon] = WEAPONS[p.weapon].ammoMax;

      // Respawn pickup after 15 seconds
      setTimeout(() => {
        p.active = true;
        p.box.visible = true;
        p.ring.visible = true;
      }, 15000);
    }
  }
}

// =============================================
// FIRE LOGIC
// =============================================

function canFire() {
  const w = WEAPONS[currentWeapon];
  if(isReloadingWeapon) return false;
  if(!w.isMelee && weaponAmmo[currentWeapon] <= 0) return false;
  if(Date.now() - lastFireTime < w.fireRate) return false;
  return true;
}

function fireWeapon(scene, camera, pitch, yaw, walls, remotePlayers, bullets, ws, spawnImpact, showMuzzleFlash, showHitMarker, weaponGroup, updateAmmoHUD) {
  if(!canFire()) {
    // Auto reload if empty
    if(!WEAPONS[currentWeapon].isMelee && weaponAmmo[currentWeapon] <= 0) {
      startWeaponReload(updateAmmoHUD);
    }
    return;
  }

  const w = WEAPONS[currentWeapon];
  lastFireTime = Date.now();

  // Recoil
  weaponGroup.position.z += 0.05;
  setTimeout(() => { weaponGroup.position.z -= 0.05; }, 80);

  showMuzzleFlash();

  if(w.isMelee) {
    // Melee — short range raycast
    const dir = new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
    const origin = camera.position.clone();
    const ray = new THREE.Raycaster(origin, dir.clone().normalize(), 0, w.range);

    for(const [pid, pObj] of Object.entries(remotePlayers)) {
      if(!pObj.alive) continue;
      const hits = ray.intersectObject(pObj.group, true);
      if(hits.length > 0) {
        if(ws && ws.readyState===1) ws.send(JSON.stringify({ type:'hit', targetId:pid, damage:w.damage }));
        showHitMarker();
        // Knife slash animation
        weaponGroup.rotation.z -= 0.5;
        setTimeout(() => { weaponGroup.rotation.z += 0.5; }, 150);
        break;
      }
    }
    return;
  }

  // Ranged — fire pellets
  if(!w.isMelee) {
    weaponAmmo[currentWeapon]--;
    updateWeaponHUD(updateAmmoHUD);

    for(let p=0; p<w.pellets; p++) {
      const spreadX = (Math.random()-0.5)*w.spread;
      const spreadY = (Math.random()-0.5)*w.spread;
      const dir = new THREE.Vector3(spreadX, spreadY, -1).applyEuler(new THREE.Euler(pitch,yaw,0,'YXZ')).normalize();
      const origin = camera.position.clone().add(new THREE.Vector3(0,-0.05,0));

      // Bullet mesh
      const bMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshBasicMaterial({ color: w.bulletColor })
      );
      bMesh.position.copy(origin);
      scene.add(bMesh);
      bullets.push({ mesh:bMesh, pos:origin.clone(), dir:dir.clone(), speed:w.bulletSpeed, life:w.range/w.bulletSpeed });

      // Immediate raycast for wall impact
      const ray = new THREE.Raycaster(origin, dir.clone().normalize(), 0, w.range);
      const wallHits = ray.intersectObjects(walls.map(ww=>ww.mesh));
      if(wallHits.length > 0) {
        const h = wallHits[0];
        setTimeout(() => spawnImpact(h.point, h.face ? h.face.normal : new THREE.Vector3(0,1,0)), 30);
      }

      // Hit detection — only first pellet counts for player damage
      if(p === 0) {
        for(const [pid, pObj] of Object.entries(remotePlayers)) {
          if(!pObj.alive) continue;
          const hits = ray.intersectObject(pObj.group, true);
          if(hits.length > 0) {
            if(ws && ws.readyState===1) ws.send(JSON.stringify({ type:'hit', targetId:pid, damage:w.damage }));
            showHitMarker();
            break;
          }
        }
      }
    }

    // Broadcast shot
    const dir0 = new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
    const origin0 = camera.position.clone();
    if(ws && ws.readyState===1) {
      ws.send(JSON.stringify({ type:'shoot', origin:{x:origin0.x,y:origin0.y,z:origin0.z}, direction:{x:dir0.x,y:dir0.y,z:dir0.z} }));
    }

    // Auto reload when empty
    if(weaponAmmo[currentWeapon] <= 0) {
      startWeaponReload(updateAmmoHUD);
    }
  }
}

// =============================================
// RELOAD
// =============================================

function startWeaponReload(updateAmmoHUD) {
  const w = WEAPONS[currentWeapon];
  if(w.isMelee || isReloadingWeapon) return;
  if(weaponAmmo[currentWeapon] >= w.ammoMax) return;

  isReloadingWeapon = true;

  const bar = document.getElementById('reload-bar');
  const fill = document.getElementById('reload-fill');
  const txt = document.getElementById('reloading-text');
  bar.style.display = 'block';
  txt.style.display = 'block';
  fill.style.transition = 'none';
  fill.style.width = '0%';
  setTimeout(() => {
    fill.style.transition = `width ${w.reloadTime}ms linear`;
    fill.style.width = '100%';
  }, 20);

  setTimeout(() => {
    weaponAmmo[currentWeapon] = w.ammoMax;
    isReloadingWeapon = false;
    bar.style.display = 'none';
    txt.style.display = 'none';
    fill.style.width = '0%';
    updateWeaponHUD(updateAmmoHUD);
  }, w.reloadTime);
}

// =============================================
// MINIMAP PICKUPS
// =============================================

function drawPickupsOnMinimap(mmCtx, worldToMM) {
  const colors = { shotgun:'#e67e22', smg:'#3498db', pistol:'#f39c12' };
  for(const p of activePickups) {
    if(!p.active) continue;
    const {mx, my} = worldToMM(p.x, p.z);
    const col = colors[p.weapon] || '#fff';
    // Diamond shape
    mmCtx.save();
    mmCtx.translate(mx, my);
    mmCtx.rotate(Math.PI/4);
    mmCtx.fillStyle = col;
    mmCtx.fillRect(-3, -3, 6, 6);
    mmCtx.restore();
  }
}
