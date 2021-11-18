import React, {MutableRefObject, Ref, RefObject, useState} from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import {createEvent, createStore, combine} from 'effector';
import {useStore} from 'effector-react';

interface figure{
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    id: string;
}

interface Props  {
    shapeProps: figure;
    isSelected: boolean;
    onSelect: ()=>void;
    onChange: (newAttrs:any)=>void;
}

const Rectangle:React.FC<Props> = ({ shapeProps, isSelected, onSelect, onChange }) => {
    const shapeRef:any = React.useRef();
    const trRef:any = React.useRef();

    React.useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <React.Fragment>
            <Rect
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                {...shapeProps}
                draggable
                onDragEnd={(e) => {
                    onChange({
                        ...shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    // transformer is changing scale of the node
                    // and NOT its width or height
                    // but in the store we have only width and height
                    // to match the data better we will reset scale on transform end
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    // we will reset it back
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...shapeProps,
                        x: node.x(),
                        y: node.y(),
                        // set minimal value
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(node.height() * scaleY),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // limit resize
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </React.Fragment>
    );
};


const $positions = createStore([{x:20,y:20,width:100,height:100,fill:'red',id:'rec1'},{x:200,y:20,width:100,height:100,fill:'green',id:'rec2'}]);
const setPositions = createEvent<figure[]>();

$positions
    .on(setPositions, (_,newPos) => newPos)

function App() {
    const pos = useStore($positions);
    const [selectedId,setSelected] = useState('');

    return (
        <Stage width={window.innerWidth} height={window.innerHeight}>
              <Layer>
                  {pos.map((rect,index) =>(
                      <Rectangle
                          key={index}
                          shapeProps={rect}
                          isSelected={rect.id === selectedId}
                          onSelect={()=>{
                              setSelected(rect.id)
                          }}
                          onChange={(newAttrs) => {
                              const rects = pos.slice();
                              rects[index] = newAttrs;
                              setPositions(rects);
                          }}
                      />
                  ))}
              </Layer>
        </Stage>
    );
}

export default App;
