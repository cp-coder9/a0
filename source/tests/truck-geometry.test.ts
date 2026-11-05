import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createTruckModel} from '../lib/truck-3d';

describe('original reference-based tractor exterior geometry',()=>{
 it.each(['g7h','howo-max'])('provides a rounded, framed articulated cab for %s',id=>{
  const m=createTruckModel(id);
  expect(m.root.userData.accuracy).toBe('Original reference-based illustration; not exact factory CAD');
  expect(m.root.getObjectByName('roof') instanceof THREE.Mesh).toBe(true);
  expect((m.root.getObjectByName('roof') as THREE.Mesh).geometry instanceof RoundedBoxGeometry).toBe(true);
  expect(m.doors.map(d=>d.name)).toEqual(['left-door','right-door']);
  expect(m.doors[0].position.toArray()).toEqual([-1.19,1.6,-2.4]);
  expect(m.doors[1].position.toArray()).toEqual([1.19,1.6,-2.4]);
  expect(m.service.position.toArray()).toEqual([0,2.2,-2.55]);
  for(const door of m.doors){expect(door.getObjectByName('door-window-recess')).toBeTruthy();expect(door.getObjectByName('mirror-upper-stalk')).toBeTruthy();}
  expect(m.root.getObjectByName(id==='g7h'?'c7h-mesh-grille':'max-chevron-grille')).toBeTruthy();
 });
 it('puts engine service detail forward of the block so opening the panel reveals it',()=>{
  const m=createTruckModel('g7h');m.root.updateMatrixWorld(true);
  const ribs=new THREE.Box3().setFromObject(m.root.getObjectByName('engine-cast-ribs')!);
  const block=new THREE.Box3().setFromObject(m.root.getObjectByName('engine-block')!);
  expect(ribs.min.z).toBeLessThan(block.min.z-.025);
 });
 it.each(['g7h','howo-max'])('provides batched road-running and coupling detail without a fake cockpit for %s',id=>{
  const m=createTruckModel(id);const names=['tyre-tread-batch','wheel-stud-batch','rim-vent-batch','fifth-wheel','air-hoses','fuel-tank','tank-straps','front-wheel-arch','rear-mudguard','cab-step-tread-batch','chassis-crossmembers'];
  for(const name of names)expect(m.root.getObjectByName(name),name).toBeTruthy();
  expect(m.root.getObjectByName('tyre-tread-batch')?.userData.repeatedElements).toBeGreaterThan(500);
  let meshes=0;m.root.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;expect(Array.from(o.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);}});
  expect(meshes).toBeLessThan(240);
  expect(m.root.getObjectByName('dashboard') instanceof THREE.Mesh).toBe(false);
  expect(m.root.getObjectByName('seat-cushion')).toBeUndefined();
  m.root.updateMatrixWorld(true);const before=new THREE.Vector3();m.doors[0].getObjectByName('door-handle')!.getWorldPosition(before);m.doors[0].rotation.y=-1.1;m.root.updateMatrixWorld(true);const after=new THREE.Vector3();m.doors[0].getObjectByName('door-handle')!.getWorldPosition(after);expect(before.distanceTo(after)).toBeGreaterThan(.5);expect(m.doors[1].rotation.y).toBe(0);
 });
});
