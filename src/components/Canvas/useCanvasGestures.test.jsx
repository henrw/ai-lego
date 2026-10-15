import {render,fireEvent,screen,act} from '@testing-library/react';
import useCanvasGestures from './useCanvasGestures';
function Harness(){const {zoom,panning}=useCanvasGestures();return <div id="canvas" data-testid="canvas"><output>{zoom}</output><span>{panning?'Panning':'Ready'}</span><textarea aria-label="Description"/></div>;}
beforeEach(()=>{jest.spyOn(window,'scrollTo').mockImplementation(()=>{});jest.spyOn(window,'requestAnimationFrame').mockImplementation(fn=>{fn();return 1;});});
afterEach(()=>jest.restoreAllMocks());
it('uses pinch/Ctrl wheel to zoom while leaving normal two-finger scroll native',()=>{
 render(<Harness/>);const canvas=screen.getByTestId('canvas');
 const normal=new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:50});act(()=>canvas.dispatchEvent(normal));expect(normal.defaultPrevented).toBe(false);
 const pinch=new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-100,clientX:200,clientY:100});act(()=>canvas.dispatchEvent(pinch));expect(pinch.defaultPrevented).toBe(true);expect(Number(screen.getByRole('status').textContent)).toBeGreaterThan(1);expect(window.scrollTo).toHaveBeenCalled();
});
it('pans with Space-drag without interfering with typing',()=>{
 render(<Harness/>);
 fireEvent.keyDown(screen.getByLabelText('Description'),{code:'Space'});fireEvent.mouseDown(screen.getByTestId('canvas'),{button:0,clientX:40,clientY:30});expect(screen.getByText('Ready')).toBeInTheDocument();
 fireEvent.keyDown(window,{code:'Space'});fireEvent.mouseDown(screen.getByTestId('canvas'),{button:0,clientX:40,clientY:30});fireEvent.mouseMove(window,{clientX:20,clientY:10});expect(window.scrollTo).toHaveBeenCalledWith({left:20,top:20,behavior:'instant'});fireEvent.mouseUp(window);expect(screen.getByText('Ready')).toBeInTheDocument();
});

it('intercepts pinch over block text fields before Chrome can zoom the page',()=>{
 render(<Harness/>);
 const event=new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-20,clientX:200,clientY:100});
 act(()=>screen.getByLabelText('Description').dispatchEvent(event));
 expect(event.defaultPrevented).toBe(true);
 expect(Number(screen.getByRole('status').textContent)).toBeGreaterThan(1);
});
