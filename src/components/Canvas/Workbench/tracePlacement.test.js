import { tracePlacement } from './tracePlacement';
const viewport={x:0,y:64,width:1000,height:600};
const size={width:290,height:140};
const active={x:100,y:160,width:240,height:200};
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
it('fits a comment in whitespace without covering the active or adjacent blocks',()=>{
 const obstacles=[active,{x:380,y:160,width:240,height:400},{x:100,y:400,width:240,height:200}];
 const place=tracePlacement(active,obstacles,size,viewport);
 expect(place).not.toBeNull();obstacles.forEach(block=>expect(overlaps(place,block)).toBe(false));
 expect(place.x+place.width).toBeLessThanOrEqual(1000);expect(place.y).toBeGreaterThanOrEqual(64);
});
it('uses the dock fallback when there is no room, including narrow screens',()=>{
 expect(tracePlacement(active,[{x:0,y:64,width:1000,height:600}],size,viewport)).toBeNull();
 expect(tracePlacement(active,[active],size,{x:0,y:64,width:250,height:400})).toBeNull();
});
it('accounts for taller streamed comments and scrolled viewports',()=>{
 const bounds={x:400,y:300,width:700,height:500};
 const block={x:500,y:340,width:240,height:200};
 const place=tracePlacement(block,[block],{width:290,height:220},bounds);
 expect(place).not.toBeNull();expect(overlaps(place,block)).toBe(false);
 expect(place.y+place.height).toBeLessThanOrEqual(800);
});
it('can move a smaller avatar in a narrow gap while its comment stays in the dock',()=>{
 const block={x:100,y:160,width:240,height:400};
 const other={x:380,y:160,width:240,height:400};
 const place=tracePlacement(block,[block,other],{width:28,height:52},{x:90,y:150,width:540,height:410},2);
 expect(place).not.toBeNull();expect(overlaps(place,block)).toBe(false);expect(overlaps(place,other)).toBe(false);
});
