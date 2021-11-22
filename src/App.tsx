import React, { useEffect, useRef, useState} from 'react';
import {Stage, Layer, Rect, Transformer, Group} from 'react-konva';
import {createEvent, createStore} from 'effector';
import {useStore} from 'effector-react';
import Konva from "konva";
import { v4 as uuidv4 } from 'uuid';


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
    onChange: (newAttrs:any)=>void;
    isDraggable: boolean;
    onClick: (e:any)=>void;
}

const Rectangle:React.FC<Props> = (({shapeProps, isSelected, onChange, isDraggable,onClick}) => {
        const trRef = useRef<Konva.Transformer>(null);
        const ref = useRef<Konva.Rect>(null);

        useEffect(() => {
            if (isSelected && trRef.current && ref && typeof ref !== 'function' && ref.current) {
                trRef.current.nodes([ref.current]);
                trRef.current.getLayer()!.batchDraw();
            }
        }, [isSelected]);

        return (
            <React.Fragment>
                <Rect
                    onClick={onClick}
                    onTap={onClick}
                    ref={ref}
                    {...shapeProps}
                    draggable={isDraggable}
                    onDragEnd={(e) => {
                        onChange({
                            ...shapeProps,
                            x: e.target.x(),
                            y: e.target.y(),
                        });
                    }}
                    onTransformEnd={(e) => {
                        if (typeof ref !== 'function' && ref){
                            let node=ref.current;
                            if (node) {
                                const scaleX = node.scaleX();
                                const scaleY = node.scaleY();

                                node.scaleX(1);
                                node.scaleY(1);
                                onChange({
                                    ...shapeProps,
                                    x: node.x(),
                                    y: node.y(),
                                    width: Math.max(5, node.width() * scaleX),
                                    height: Math.max(node.height() * scaleY),
                                });
                            }
                        }
                    }}
                />
                {isSelected && (
                    <Transformer
                        ref={trRef}
                        boundBoxFunc={(oldBox, newBox) => {
                            if (newBox.width < 5 || newBox.height < 5) {
                                return oldBox;
                            }
                            return newBox;
                        }}
                    />
                )}
            </React.Fragment>
        )
    }
);


const $positions = createStore([
    {x:20,y:20,width:100,height:100,fill:'red',id:'1'},
    {x:200,y:20,width:100,height:100,fill:'green',id:'2'},
    {x:400,y:20,width:100,height:100,fill:'green',id:'3'},
    {x:600,y:20,width:100,height:100,fill:'green',id:'4'}
]);

const setPositions = createEvent<figure[]>();
const cloneShape = createEvent<figure>();

$positions
    .on(setPositions, (_,newPos) => newPos)
    .on(cloneShape, (shapes, clone)=> [...shapes, clone,])

function App() {
    const pos = useStore($positions);
    const [selectedId,setSelected] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
    const [group, setGroup] = useState<boolean>(false);

    // const groupArray = pos.filter(rect => selectedGroup.includes(rect.id));
    // const freeArray = pos.filter(rect => !selectedGroup.includes(rect.id));
    // const mergedArray = [...groupArray, ...freeArray];
    //

    console.log("render");
    // console.log(groupArray,freeArray);

    const drawFigures =(arr:figure[],draggable:boolean)=>{
        return arr.map((rect,index) =>(
            <Rectangle
                isDraggable={draggable}
                key={index}
                shapeProps={rect}
                isSelected={selectedGroup.includes(rect.id)||rect.id === selectedId}
                onChange={(newAttrs) => {
                    const rects = pos.slice();
                    rects[index] = newAttrs;
                    setPositions(rects);
                }}
                onClick={(e)=>{
                    setSelected(rect.id);
                    const updatedGroup = [rect.id];
                    setSelectedGroup(updatedGroup);
                    // setSelectedGroup(updatedGroup);
                    // if(e.evt.shiftKey){
                    //     if(!selectedGroup.includes(selectedId)){
                    //         const updatedGroup = [...selectedGroup,selectedId,];
                    //         setSelectedGroup(updatedGroup);
                    //     }
                    // }else{
                    //     setSelectedGroup([selectedId]);
                    // }
                }}
            />
        ))
    }

    // const checkDeselect = (e:any) => {
    //     // deselect when clicked on empty area
    //     const clickedOnEmpty = e.target === e.target.getStage();
    //     if (clickedOnEmpty) {
    //         setSelected('');
    //         trRef.current.nodes([]);
    //         setNodes([]);
    //         // layerRef.current.remove(selectionRectangle);
    //     }
    // };

    return (
        <div
             onKeyDown={(e)=>{
                 e.preventDefault();
                 if(e.ctrlKey){
                     if(e.key === 'd'){
                         const clone = Object.assign({}, pos.find(word => word.id === selectedId))
                         if(clone !== undefined){
                             clone.id = uuidv4();
                             cloneShape(clone);
                         }
                     }
                 }
                 if(e.ctrlKey){
                     if(e.key === 'g'){
                         setGroup(true);
                     }
                 }
             }}
             tabIndex={0}>
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                // onDoubleClick={()=>{
                //     setSelectedGroup([]);
                //     setSelected('');
                // }}
                // tabIndex={0}
                // onTouchStart={checkDeselect}
            >

                  <Layer>
                      {/*{!group && drawFigures(mergedArray,true)}*/}
                      {/*{true && (*/}
                      {/*    <Group draggable>*/}
                      {/*        {drawFigures(groupArray, false)}*/}
                      {/*    </Group>*/}
                      {/*)}*/}
                      {/*{true && drawFigures(freeArray,true)}*/}
                      {drawFigures(pos,true)}
                  </Layer>
            </Stage>
        </div>
    );
}


export default App;
