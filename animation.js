const chars = " .,:;i1tfLCG08@";
const width = 120;
const height = 60;

const output = document.getElementById("ascii");

let t = 0;

function frame(){

    let text = "";

    for(let y=0;y<height;y++){

        for(let x=0;x<width;x++){

            let wave =
                Math.sin(x*0.18+t)+
                Math.cos(y*0.14+t*1.2)+
                Math.sin((x+y)*0.08+t*0.5);

            let index = Math.floor(
                ((wave+3)/6)*(chars.length-1)
            );

            text += chars[index];

        }

        text += "\n";
    }

    output.textContent = text;

    t += 0.05;

    requestAnimationFrame(frame);

}

frame();
