import { Bodies, Body, Composite, Engine, Events, Render, Runner } from "matter-js";
import { FRUITS_BASE } from "./fruits";

//////////////////////////////////// 기본 틀 생성 S ////////////////////////////////////
let scoreArr = [];
let currentScore = 0;
const engine = Engine.create();
const render = Render.create({
    engine:  engine,
    element: document.querySelector("#divGame"),
    options:{
        wireframes: false,
        background : "#E6E6FA",
        width: 520,
        height: 850,
    }
});

const world = engine.world;

const leftWall = Bodies.rectangle(15, 395, 30, 790, {
    isStatic : true,
    render:{ fillStyle: "#D5BDEE"}

});
const rightWall = Bodies.rectangle(505, 395, 30, 790, {
    isStatic : true,
    render:{ fillStyle: "#D5BDEE"}
});
// 
//const ground = Bodies.rectangle(210, 820, 620, 0, {
const ground = Bodies.rectangle(210, 820, 620, 60, {
    isStatic : true,
    render:{ fillStyle: "#D5BDEE"}

});

const topLine = Bodies.rectangle(210, 150, 620, 2, {
    name: "topLine",
    isStatic : true,
    isSensor: true,
    render:{ fillStyle: "#D5BDEE"}
});

Composite.add(world, [leftWall, rightWall, ground, topLine]);

Render.run(render);
Runner.run(engine);

///// 배경음 ////
const bgm = new Audio('sound/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3;
bgm.muted = true;

//////////////////////////////////// 기본 틀 생성 E ////////////////////////////////////

// 게임용 전역변수a
let currentBody = null;
let currentFruit = null;
let disableAction = false;
let interval = null;

// 과일 추가
function addFruit(){
    const index = Math.floor(Math.random() * 5);
    //const index = 9;
    const fruit = FRUITS_BASE[index];

    const body = Bodies.circle(250, 50, fruit.radius, {
        name: 'fruit',
        index: index,
        isSleeping: true,
        background:"black",
        render:{
            sprite:{ texture: `${fruit.name}.png`},            
        },
        restitution: 0.5
    });

    currentBody = body;
    currentFruit = fruit;

    Composite.add(world, body);
}

// asd 키보드 과일이동
window.onkeydown = (event) => {
    if(disableAction){
        return;
    }

    switch (event.code) {
        case "KeyA":
            if(interval){
                return;
            }
            interval = setInterval(()=>{
                if(currentBody.position.x - currentFruit.radius > 30){
                    Body.setPosition(currentBody, { 
                        x:currentBody.position.x-1, 
                        y:currentBody.position.y
                    });
                }
            }, 5);
            break;

        case "KeyD":  
            if(interval){
                return;
            }
            interval = setInterval(()=>{
                if(currentBody.position.x + currentFruit.radius < 490){
                    Body.setPosition(currentBody, { 
                        x:currentBody.position.x+1, 
                        y:currentBody.position.y
                    });
                }
            }, 5);
            break;

        case "KeyS":
            currentBody.isSleeping = false;
            disableAction = true;

            const popSound = new Audio("sound/pop_sound.mp3");
            popSound.volume = 0.4;
            popSound.play();

            setTimeout(() => {                
                addFruit();
                disableAction = false;
            }, 1000);
            break;

        default:
            break;
    }
}

// 키보드에서 손떼면
window.onkeyup = (event) => {
    switch (event.code) {
        case "KeyA":
        case "KeyD":
            clearInterval(interval);
            interval = null;
            break;    
    }
};


// 과일끼리 닿음
Events.on(engine, "collisionStart", (event)=>{

    event.pairs.forEach((collision) => {
        if(collision.bodyA.index === collision.bodyB.index){

            const index = collision.bodyA.index;

            // 제일 큰 과일일때
            if(index === FRUITS_BASE.length -1){

                const applause = new Audio('sound/applause.mp3');
                applause.volume = 0.3;
                applause.play().finally(()=>{

                    alert('횐이를 2개나 만드시다니 대단해요!\n이어서 게임하시겠어요?');

                    // 제일큰 과일 합쳤을땐 보너스점수 1000점
                    currentScore += 1000;
                    setInnerHtml("pCurrentScore", currentScore);
                    Composite.remove(world, [collision.bodyA, collision.bodyB]);
                });
                return;
            }

            // 점수 화면 갱신
            let addScore = (collision.bodyA.index + collision.bodyB.index + 2) * 2;
            currentScore += addScore;
            setInnerHtml("pCurrentScore", currentScore);

            Composite.remove(world, [collision.bodyA, collision.bodyB]);

            const newFruit = FRUITS_BASE[index + 1];
            const newBody = Bodies.circle(
                collision.collision.supports[0].x,
                collision.collision.supports[0].y,
                newFruit.radius,
                {
                    render:{
                        sprite:{ texture: `${newFruit.name}.png`}
                    },
                    index: index + 1,
                }

            );
            
            // 닿을때마다 sound생성해야 파파팍될때 소리 정상작동
            popSound(index);
            Composite.add(world, newBody);
        }
    });
});

// GameOver판정
Events.on(engine, "collisionActive", (event)=>{
    
    let isGameEnd = false;

    if(!disableAction){
        event.pairs.forEach((collision) => {            
            // 상단선에 닿음
            if(!disableAction && (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")){
                isGameEnd = true;
            }
        });
    }

    if(isGameEnd){
        
        alert("이런! 게임오버😢\n확인 버튼을 누르고 다시해볼까요?");

        // 최고 점수 갱신
        scoreArr.push(currentScore);
        setInnerHtml("pMaxScore", Math.max(...scoreArr));

        // 현재 점수 갱신        
        currentScore = 0;
        setInnerHtml("pCurrentScore", currentScore);

        
        // 과일 제거
        event.pairs.forEach((collision) => {
            if(!collision.bodyA.isStatic){
                Composite.remove(world, [collision.bodyA]);
            }
            if(!collision.bodyB.isStatic){
                Composite.remove(world, [collision.bodyB]);
            }
        });
        isGameEnd = false;
    }
});


function popSound(index){

    let soundSrc = "";
    switch (index) {
        case 0:
            soundSrc = 'sound/pop-chodang.mp3';            
            break;
        case 1:
            soundSrc = 'sound/pop-rave.mp3';            
            break;
        case 2:
            soundSrc = 'sound/pop-nan2.mp3';            
            break;
        case 3:
            soundSrc = 'sound/pop-mongsuk.mp3';            
            break;
        case 4:
            soundSrc = 'sound/pop-ponzoo.mp3';            
            break;
        case 5:
            soundSrc = 'sound/longpop-chodang.mp3';            
            break;
        case 6:
            soundSrc = 'sound/longpop-rave.mp3';            
            break;
        case 7:
            soundSrc = 'sound/longpop-nan2.mp3';            
            break;
        case 8:
            soundSrc = 'sound/longpop-mongsuk.mp3';            
            break;
        case 9:
            soundSrc = 'sound/longpop-ponzoo.mp3';            
            break;
            
        default:
            soundSrc = 'sound/pop_sound.mp3';
            break;
    }

    const popSound = new Audio(soundSrc);
    popSound.volume = 0.6;
    popSound.play();
}

// 최초 1회 과일생성
addFruit();

function setInnerHtml(id, content){
    document.querySelector("#" + id).innerHTML = content.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}


// 다시하기 버튼
document.querySelector("#btnRetry").addEventListener("click", ()=>{

    if(confirm("정말 다시 하시겠어요?")){
        
        // 최고 점수 갱신
        scoreArr.push(currentScore);
        setInnerHtml("pMaxScore", Math.max(...scoreArr));

        // 현재 점수 갱신        
        currentScore = 0;
        setInnerHtml("pCurrentScore", currentScore);

        Composite.allBodies(world).forEach(element => {
            if(!element.isStatic){
                Composite.remove(world, element);
            }        
        });
    
        currentBody.isSleeping = false;
        disableAction = true;
    
        setTimeout(() => {                
            addFruit();
            disableAction = false;
        }, 100);
    }
    
});

if(confirm("저작권 무료 배경음을 켜시겠어요?")){
    bgm.play();
    bgm.muted = false;
}