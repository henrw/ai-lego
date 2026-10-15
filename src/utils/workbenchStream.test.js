import { readWorkbenchStream } from './workbenchStream';
// Small chunks exercise UTF-8 decoding, event boundaries, and error handling.
const response = events => {
 const bytes = new TextEncoder().encode(events.map(e => JSON.stringify(e)).join('\n'));
 let offset=0;
 return {body:{getReader:()=>({read:async()=>offset<bytes.length?{value:bytes.slice(offset,offset+=3),done:false}:{done:true},releaseLock:jest.fn()})}};
};
beforeAll(()=>{const util=require('util');global.TextEncoder=util.TextEncoder;global.TextDecoder=util.TextDecoder;});
it('delivers drafts before a verified completion, preserving Unicode',async()=>{
 const progress=jest.fn();const complete={type:'complete',result:{message:'café'}};
 expect(await readWorkbenchStream(response([{type:'progress',entries:[{comment:'café'}]},complete]),progress)).toEqual(complete);
 expect(progress).toHaveBeenCalledWith([{comment:'café'}]);
});
it('does not accept an interrupted or invalid stream as a completed run',async()=>{
 await expect(readWorkbenchStream(response([{type:'progress',entries:[]}]),jest.fn())).rejects.toThrow(/before verification/);
 await expect(readWorkbenchStream(response([{type:'error',error:'Unverified draft'}]),jest.fn())).rejects.toThrow('Unverified draft');
});
