import { projectThumbnail } from './projectThumbnail';
it('renders the preview on an unattached canvas without changing the viewport', () => {
 const context={scale:jest.fn(),fillRect:jest.fn(),strokeRect:jest.fn(),fillText:jest.fn(),measureText:()=>({width:20})};
 const canvas={getContext:()=>context,toDataURL:jest.fn(()=> 'data:image/png;thumbnail')};
 const create=jest.spyOn(document,'createElement').mockReturnValue(canvas);
 const append=jest.spyOn(document.body,'appendChild');
 const scroll=jest.spyOn(window,'scrollTo').mockImplementation(()=>{});
 try {
  expect(projectThumbnail([{uid:'task',stage:'task',position:{x:1600,y:600},description:'Rank applications'}],[])).toBe('data:image/png;thumbnail');
  expect(append).not.toHaveBeenCalled(); expect(scroll).not.toHaveBeenCalled();
  expect(context.fillText).toHaveBeenCalledWith('Task',1610,627);
 } finally {create.mockRestore();append.mockRestore();scroll.mockRestore();}
});
