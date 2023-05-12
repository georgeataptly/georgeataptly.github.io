const controls = {
    speed: 7,
    dice_interval: 7000, //how often dice are rolled for possibility of birds (10000)
    spawn_window: 5000,
    flap_to_angle: 2, //number divided by flight angle for wingflap amount (2)
    flap_plus: 7, //number added to original wingflap amount (5)
    pitch_bias: 0.8, //percentage of angle expression
    vertical_range: [-10,10], //possibility range of amount added to x position per coordinate
    horizontal_range: [30, 41], //possibility range of y per coordinate
    scale_range: [0.8,1.6],
    flock_spread: [7,9],
    scale_spread: [-0.1,0.1]
    //function for this variable not added yet //const g_bias = 0.25; // anim time %+/- dependant on +/- vertical change
}

const bird_files= ['graphics/bird_wings_up.svg','graphics/bird_wings_down.svg'];

//used by functions to keep track of bird instances
let id_num= 0;

//you know what this does
function random(lower, upper) {
    return Math.floor(Math.random()*(upper-lower))+lower;
}
function random_float(lower, upper) {
    return (Math.random()*(upper-lower))+lower;
}
//garbage collection function, deletes div and CSS
function promisedLand(gen_div_id, gen_style_id) {
    const div= document.getElementById(gen_div_id);
    const style= document.getElementById(gen_style_id);
    div.remove();
    style.remove();
}

function id() {
    if (id_num < 100) {
        id_num++;
    } else {
        id_num= 0;
    }
    return id_num;
}

function html(total_length, length_relative, progress_x, offset_y, angles, scale) {
    const bird_id= id();
    let keyframes_x= '';
    let keyframes_y= '';
    let keyframes_r= '0% {transform: rotate(0deg)}';
    let wingup= false;
    //converts coordinate data to keyframes and appends it to strings
    for (let i = 0; i < progress_x.length ; i++) {
        keyframes_x += `\n   ${length_relative[i]}% {transform: translateX(${-progress_x[i]}vw)}`;
        keyframes_y += `\n   ${length_relative[i]}% {transform: translateY(${offset_y[i]}vh)}`;
        if (angles[i]<0){
            let flaps= Math.round(angles[i]/-controls.flap_to_angle)+controls.flap_plus;
            let percentage= (length_relative[i+1]-length_relative[i])/(flaps+2);
            for (let t= 0; t<flaps; t++) {
                if (wingup) {
                    keyframes_y += `${length_relative[i]+percentage*(t+1)}% {content: url(${bird_files[0]})}`;
                    wingup= false;
                } else {
                    keyframes_y += `${length_relative[i]+percentage*(t+1)}% {content: url(${bird_files[1]})}`;
                    wingup= true;
                }
            }
        }
        if (i < progress_x.length -1) {
            keyframes_r += `\n   ${(length_relative[i]+length_relative[i+1])/2}% {transform: rotate(${-angles[i]}deg)}`;
        }
    keyframes_r += '100% {transform: rotate(0deg)}'
    }
    //template literals with style and content
    let http_jab= `<div class="bird-r" id=r${bird_id}><div class="bird-y" id="y${bird_id}"></div></div>`;
    let style_jab= `#x${bird_id} {\n   animation-name: ax${bird_id};\n   animation-duration: ${total_length}s;\n}\n@keyframes ax${bird_id}{${keyframes_x}\n}\n#y${bird_id} {\n   height: ${scale}vh;\n   animation-name: ay${bird_id};\n   animation-duration: ${total_length}s;\n}\n@keyframes ay${bird_id}{${keyframes_y}\n}\n#r${bird_id} {\n   animation-name: ar${bird_id};\n   animation-duration: ${total_length}s;\n}\n@keyframes ar${bird_id}{${keyframes_r}\n}\n`;
    
    //creates <div> with unique id and adds it to page
    let gen_div= document.createElement('div');
    gen_div.setAttribute('id',"x"+bird_id);
    gen_div.setAttribute('class', 'bird-x');
    document.body.appendChild(gen_div);

    //creates <style> with unique id and adds it to page
    let gen_style= document.createElement('style');
    gen_style.setAttribute('id',"s"+bird_id);
    document.head.appendChild(gen_style);
    
    //adds content "jabs" to newly created elements
    document.getElementById("s"+bird_id).innerHTML = style_jab.toString();
    document.getElementById("x"+bird_id).innerHTML = http_jab;

    //calls garbage collection to remove elements once total time has passed
    const ms= Math.round(total_length * 990);
    setTimeout(promisedLand, ms,('x'+bird_id),('s'+bird_id));

}
//animation timing function
// input coordinates, output total time, percentage breaks
function timeAndPitch(progress_x,offset_y,scale) {
    const angles= [];
    let total_length= 0; 
    const length_absolute= [0];
    const length_relative= [];
    const weigth= Math.sqrt(scale);
    console.log(weigth)
    //loops through coordinates and caclulates angles and lengths with some basic trigonometry
    for (let i= 0; i < progress_x.length -1; i++) {
        const rise= -(offset_y[i]-offset_y[i+1]);
        const run= -(progress_x[i]-progress_x[i+1]);
        const angle= Math.atan2(rise, run) * 180 / Math.PI;
        const length= Math.sqrt(Math.pow(rise, 2) + Math.pow(run, 2)) / weigth;
        total_length += length;
        length_absolute.push(Math.round(length + length_absolute[length_absolute.length-1]));
        angles.push(Math.round(angle * controls.pitch_bias));
    }
    //divides individual lengths from total length to get relative length (percentage) for use in CSS keyframes
    for (let i= 0; i < length_absolute.length; i++) {
        length_relative.push(Math.round(length_absolute[i]/total_length * 100));
    }
    //checks and fixes inherent division errors
    //can be removed if distance relative calculations are reworked to have addeition before division
    for (let i= 0; i < length_relative.length; i++) {
        if (length_relative[i] > 99) {
            length_relative[i] = 100;
        }
    }
    total_length= total_length/controls.speed;
    html(total_length, length_relative, progress_x, offset_y, angles, scale);
}

//creates a lists of position coordinates for random movement
//sends coordinates to next function in chain
//returns ex: [[-30,30,60,80,115],[0,10,8,-15, 3]]
function lonely() {
    const progress_x= [-15];
    const offset_y= [];
    const scale= random_float(controls.scale_range[0],controls.scale_range[1]);
    offset_y.push(random(controls.vertical_range[0],controls.vertical_range[1]));  //selects random initial location y
    while (progress_x[progress_x.length -1] <= 125) {
        progress_x.push(progress_x[progress_x.length -1] + random(controls.horizontal_range[0],controls.horizontal_range[1]));
        offset_y.push(random(controls.vertical_range[0],controls.vertical_range[1]));
    }
    timeAndPitch(progress_x, offset_y, scale);
    return [progress_x, offset_y, scale];
}

//creates multiple related flight paths and sends them to be rendered
function flock(bird_count) {
    let alpha_bird= lonely();
    let new_bird= [[],[],[]];
    for (i= 0; i < bird_count; i++) {
        let angle= 90 - random(-30,30);
        let distance= random(6, 9);
        const rise_delta= Math.sin(angle) * distance;
        const run_delta= Math.cos(angle) * distance;
        new_bird[2]= (alpha_bird[2] + random_float(controls.scale_spread[0],controls.scale_spread[1]));
        for (b= 0; b<alpha_bird[1].length; b++) {
            new_bird[0].push(alpha_bird[0][b] + rise_delta + random(-2, 1));
            new_bird[1].push(alpha_bird[1][b] + run_delta + random(-2, 1));
        }
        timeAndPitch(new_bird[0],new_bird[1],new_bird[2]);
        alpha_bird= new_bird;
        new_bird= [[],[],[]];
    }
}

//creates a number from 1-20
function birdDice() { 
    let trigger = random(0,20);
    let delay;
    if (trigger > 10 && trigger < 15) {
        delay = random(0,controls.spawn_window);
        setTimeout(lonely, delay);
    } else if (trigger > 14) {
        delay = random(0, controls.spawn_window);
        let bird_count = trigger - 14;//subtract 13 from the 15-20 range to give us bird_count range of 2-7
        setTimeout(flock, delay, bird_count);
    }
}

//Calls function birdDice every 5 seconds 
setInterval(birdDice, controls.dice_interval);