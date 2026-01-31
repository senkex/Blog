const canvas = document.getElementById("mesh");
const ctx = canvas.getContext("2d");

function resizeMesh(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeMesh();
window.addEventListener("resize", resizeMesh);

const points = [
    {x:.2,y:.3,r:520,c:"#00d4ff",dx:.00025,dy:.00035},
    {x:.8,y:.2,r:540,c:"#008cff",dx:-.00035,dy:.00025},
    {x:.3,y:.8,r:500,c:"#76faff",dx:.0004,dy:-.00025},
    {x:.7,y:.7,r:520,c:"#00aaff",dx:-.00025,dy:-.00035}
];

function drawMesh(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.globalCompositeOperation = "lighter";

    for(const p of points){
        p.x += p.dx;
        p.y += p.dy;
        if(p.x<0||p.x>1) p.dx*=-1;
        if(p.y<0||p.y>1) p.dy*=-1;

        const g = ctx.createRadialGradient(
            p.x*canvas.width,p.y*canvas.height,0,
            p.x*canvas.width,p.y*canvas.height,p.r
        );
        g.addColorStop(0,p.c);
        g.addColorStop(1,"transparent");

        ctx.fillStyle = g;
        ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    requestAnimationFrame(drawMesh);
}
drawMesh();

function animateCounter(el, target, duration = 1600){
    let start = null;

    function format(n){
        if(n >= 1000) return Math.floor(n/1000) + "K+";
        if(n >= 40) return n + "+";
        return n;
    }

    function tick(ts){
        if(!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = format(Math.floor(eased * target));
        if(p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

window.addEventListener("load", ()=>{
    document.querySelectorAll("[data-count]").forEach(el=>{
        animateCounter(el, parseInt(el.dataset.count,10));
    });
});

const globe = document.getElementById("globe");

if(globe){
    globe.style.position = "relative";
    globe.style.overflow = "hidden";
    globe.style.background =
        "linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.85))," +
        "url('https://upload.wikimedia.org/wikipedia/commons/1/1a/Argentina_blank_map.svg')";
    globe.style.backgroundSize = "cover";
    globe.style.backgroundPosition = "center";
    globe.style.border = "1px solid rgba(255,255,255,.18)";
    globe.style.backdropFilter = "blur(18px)";
    globe.style.webkitBackdropFilter = "blur(18px)";

    const timeWrap = document.createElement("div");
    timeWrap.style.position = "absolute";
    timeWrap.style.bottom = "14px";
    timeWrap.style.left = "14px";
    timeWrap.style.right = "14px";
    timeWrap.style.pointerEvents = "none";

    timeWrap.innerHTML = `
        <div id="tz-time" style="
            font-size:26px;
            font-weight:600;
            letter-spacing:-.4px;
            line-height:1;
            color:white;">
            --:--
        </div>
        <div style="
            margin-top:4px;
            font-size:12px;
            opacity:.7;">
            Buenos Aires · GMT-3
        </div>
    `;
    globe.appendChild(timeWrap);

    const pin = document.createElement("div");
    pin.style.position = "absolute";
    pin.style.width = "10px";
    pin.style.height = "10px";
    pin.style.borderRadius = "50%";
    pin.style.background = "#00aeff";
    pin.style.boxShadow = "0 0 18px #00aeff";
    pin.style.left = "57%";
    pin.style.top = "58%";
    globe.appendChild(pin);

    function updateTime(){
        const el = document.getElementById("tz-time");
        if(!el) return;

        const now = new Date();
        el.textContent = now.toLocaleTimeString(
            "es-AR",
            {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Argentina/Buenos_Aires"
            }
        );
    }

    updateTime();
    setInterval(updateTime, 60000);
}
