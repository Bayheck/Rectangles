import React, { useEffect, useRef, useState} from 'react';
import {Stage, Layer, Rect, Transformer, Group,Text} from 'react-konva';
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
    onClick: (e:any,ref:any)=>void;
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
                    onClick={(evt)=>onClick(evt,ref)}
                    onTap={(evt)=>onClick(evt,ref)}
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
            </React.Fragment>
        )
    }
);


const $positions = createStore([
    {x:20,y:20,width:100,height:100,fill:'red',id:'1'},
    {x:200,y:20,width:100,height:100,fill:'green',id:'2'},
    {x:400,y:20,width:100,height:100,fill:'red',id:'3'},
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
    const [nodesArray, setNodes] = useState<Konva.Rect[]>([]);
    const [stage, setStage] = useState({
        scale: 1,
        x: 0,
        y: 0
    });
    const trRef = useRef<Konva.Transformer>(null);
    const groupRef = useRef<Konva.Group>(null);
    const layerRef = useRef<Konva.Layer>(null);

    console.log("render");

    const inGroup = (idRect:string)=>{
        if(groupRef.current){
            if(groupRef.current.children){
                if(groupRef.current.children.find((rect) => rect.id() === idRect)){
                    return false;
                }
            }
        }
        return true;
    }

    const drawFigures =(arr:figure[])=>{
        return arr.map((rect,index) =>(
            <Rectangle
                isDraggable={inGroup(rect.id)}
                key={index}
                shapeProps={rect}
                isSelected={rect.id === selectedId}
                onChange={(newAttrs) => {
                    const rects = pos.slice();
                    rects[index] = newAttrs;
                    setPositions(rects);
                }}
                onClick={(evt,e)=>{
                    if (e.current !== undefined) {
                        let temp = nodesArray;
                        if (!nodesArray.includes(e.current)) temp.push(e.current);
                        setNodes(temp);
                        if(trRef.current){
                            trRef.current.nodes([e.current]);
                        }
                        if(evt.evt.shiftKey){
                            if(trRef.current){
                                trRef.current.nodes([...nodesArray]);
                                trRef.current.getLayer()!.batchDraw();
                            }
                        }else{
                            setNodes([]);
                        }
                    }
                    setSelected(rect.id);
                }}
            />
        ))
    }

    const checkDeselect = (e:any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            if(selectedId !== ''){
                setSelected('');
                trRef.current!.nodes([]);
            }
            if(nodesArray.length !== 0){
                setNodes([]);
            }
        }
    };

    const wheelZoom = (e:any) =>{
        e.evt.preventDefault();
        const scaleBy = 1.02;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        setStage({
            scale: newScale,
            x:(stage.getPointerPosition().x / newScale - mousePointTo.x) * newScale,
            y:(stage.getPointerPosition().y / newScale - mousePointTo.y) * newScale
        })
    }

    const sizeBox = () =>{
        if(layerRef.current){
            const selected =  layerRef.current.children?.find((shape)=>shape.id() === selectedId)
            if(selected && selected.constructor.name === 'Rect'){
                let x = selected.attrs.x;
                let height = selected.attrs.height;
                let width = selected.attrs.width;
                let y = selected.attrs.y + height + 10;
                return (
                    <Group>
                        <Rect
                            x={x}
                            y={y}
                            width={width}
                            height={40}
                            fill={'grey'}
                        />
                        <Text
                            align={'center'}
                            x={x}
                            y={y}
                            text={`Height:${Math.floor(height)}\nWidth:${Math.floor(width)}`}
                            fontSize={20}
                        />
                    </Group>
                )
            }
        }
    }

    return (<div
             onKeyDown={(e)=>{
                 e.preventDefault();
                 if(e.ctrlKey||e.metaKey){
                     if(e.key === 'd'){
                         const clone = Object.assign({}, pos.find(word => word.id === selectedId))
                         if(clone !== undefined){
                             clone.id = uuidv4();
                             cloneShape(clone);
                         }
                     }
                 }
                 if(e.ctrlKey||e.metaKey){
                     if(e.key === 'g'){
                         if(groupRef.current){
                             nodesArray.forEach(rect=>{
                                 groupRef.current!.add(rect);
                             })
                         }
                     }
                 }
             }}
             tabIndex={0}
        >
            <Stage
                width={window.innerWidth+400}
                height={window.innerHeight+400}
                onClick={checkDeselect}
                onWheel={wheelZoom}
                scaleX={stage.scale}
                scaleY={stage.scale}
                x={stage.x}
                y={stage.y}
            >
                  <Layer ref={layerRef}>
                      {layerRef.current && sizeBox()}
                      {drawFigures(pos)}
                      <Transformer
                          ref={trRef}
                          boundBoxFunc={(oldBox, newBox) => {
                              if (newBox.width < 5 || newBox.height < 5) {
                                  return oldBox;
                              }
                              return newBox;
                          }}
                      />
                      <Group ref={groupRef} draggable/>
                  </Layer>
            </Stage>
        </div>
    );
}


export default App;
