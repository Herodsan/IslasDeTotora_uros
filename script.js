THREE.DefaultLoadingManager.onProgress = function(url, cargados, total){
    const porcentaje = Math.round((cargados / total) * 100);
    document.getElementById("porcentajeCarga").innerText = "Cargando... " + porcentaje + "%";
};

THREE.DefaultLoadingManager.onLoad = function(){
    const pantalla = document.getElementById("pantallaCarga");
    pantalla.classList.add("oculto");
    setTimeout(() => { pantalla.style.display = "none"; }, 600);
};

let tiempo = 0;
let barco2;

let composer;
let outlinePass;

let barcoJugador;
let modoNavegar = false;
let velBarco = 0;
let rotBarco = 3;
const teclas = {};
const AJUSTE_ROT = Math.PI/2; 

let tarjetaAbierta = -1;
let zonaCerca = -1;
const vistas = new Set();
const iconos = [];
const punto = new THREE.Vector3();

window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if(pecesAbierto || ubicacionAbierta){
        if(k === "escape"){ cerrarPeces(); cerrarUbicacion(); }
            return;
    }
    teclas[k] = true;
    if(k === "e") tarjetaAbierta < 0 ? abrirTarjeta(zonaCerca) : cerrarTarjeta();
    if(k === "escape") cerrarTarjeta();
    if(k === "p" && barcoJugador) console.log("x:", barcoJugador.position.x.toFixed(1), "z:", barcoJugador.position.z.toFixed(1));
});

window.addEventListener("keyup", e => teclas[e.key.toLowerCase()] = false);
const islasCajas = [];
function registrarIsla(modelo, encoger = 3){
    const caja = new THREE.Box3().setFromObject(modelo);
    caja.expandByScalar(-encoger);
    islasCajas.push(caja);
}

let controls;
let paginaCultura = 0;
let destinoLook = new THREE.Vector3(); 
const INICIO_POS  = new THREE.Vector3(-20, 4, 50);
const INICIO_LOOK = new THREE.Vector3(10, 0, 30);
let animCamara = {
    activa: false,
    inicio: new THREE.Vector3(),
    objetivo: new THREE.Vector3(),
    lookInicio: new THREE.Vector3(),
    lookObjetivo: new THREE.Vector3(),
    tiempo: 0,
    duracion: 1.5
};
let water;
let luzDir2;
let luzNoche = [];
const cacheModelos = {};
const cultura = [
{
    titulo: "Origen del pueblo Uru",
    texto: "Los Uros son uno de los pueblos más antiguos del lago Titicaca y se cree que ya vivían allí mucho antes de los incas, hace más de 3.000 años. Se llaman a sí mismos Jas-Shoni, “hombres del agua”, o Kot’suña, “hombres del lago”, porque toda su vida gira en torno al agua. Al principio vivían en tierra firme, pero cuando otros pueblos como los collas y después los incas empezaron a dominar la región, decidieron mudarse al lago para protegerse. Así nacieron las islas flotantes, que se podían mover o separar si había peligro. Con el tiempo se mezclaron con los pueblos aimaras, y su lengua original, el uruquilla, casi desapareció. Hoy hablan aimara y español, pero mantienen sus costumbres, su organización en familias y su forma de vivir sobre el agua. En la actualidad hay cerca de 80 islas en el lado peruano, cerca de la bahía de Puno.",
    fuente: "GoChile",
    fuenteLink: "https://www.gochile.cl/es/articulos/isla-de-los-uros-los-secretos-del-pueblo-flotante-del-lago-titicaca.htm",
    imagen: "imagenes/tour-lago-titicaca-2.webp",
    imagenFuente: "Expedia",
    imagenLink: "https://www.expedia.ca/things-to-do/uros-floating-islands-half-day-boat-tour.a377288.activity-details",
    cam: { x: -6, y: 5, z: 18 },
    look: { x: 2, y: 0, z: 2 }
},
{
    titulo: "Viviendas flotantes",
    texto: "Las islas de los Uros se construyen con totora. Primero cortan grandes bloques de raíces, que forman el khili, y los unen con cuerdas y estacas para armar la base. Encima colocan capas de tallos de totora cruzadas, que dan firmeza y protegen de la humedad. Para que la isla no se vaya con el viento, la anclan al fondo del lago con palos clavados. Sobre esa base levantan casas pequeñas, también de totora, que suelen tener una sola habitación donde vive cada familia. La totora de abajo se va pudriendo con el agua, así que las capas de arriba se renuevan todo el tiempo, y por eso el suelo se siente blando y algo hundido al caminar. Cada isla puede llegar a tener hasta tres metros de espesor. Para cocinar usan fogones sobre bases de piedra, y para la luz muchas familias ya usan paneles solares. Cuando una isla se desgasta o hay una pelea entre familias, la pueden cortar en partes y separarla.",
    fuente: "Our Way of Life",
    fuenteLink: "https://ourwayoflife.co.nz/the-uros-islands-of-peru-explore-the-colourful-floating-village-made-of-reeds-in-lake-titicaca/",
    imagen: "imagenes/3160669315_bfedb08cc1_b.jpg",
    imagenFuente: "Flickr",
    imagenLink: "https://www.flickr.com/photos/ana12321/3160669315",
    cam: { x: 24, y: 1.5, z: 1 },
    look: { x: 29, y: -1, z: -8 }
},
{
    titulo: "Barcos de totora",
texto: "Los barcos de totora, también llamados balsas, se hacen con el mismo material que las islas. Se atan manojos de totora seca hasta darles forma curva, como una banana, y se mueven con una vara larga. Los más grandes pueden tener dos pisos y se construyen en unos seis meses. Con buen mantenimiento duran unos siete años, siempre que se sequen bien al sol para que no se pudran. Antes se usaban para pescar, cazar aves y moverse entre las islas o hasta el mercado de Puno. Hoy muchas familias usan botes con motor, y las balsas sirven sobre todo para pasear a los turistas entre las islas. Algunas tienen la proa decorada con figuras, como cabezas de animales. Son una de las imágenes más conocidas del lugar y muestran que, sin metal ni madera, los Uros lograron construir sus propios medios de transporte.",
    fuente: "Prensa Libre",
    fuenteLink: "https://www.prensalibre.com/?p=298522",
    imagen: "imagenes/tour-uros-puno-7-media.jpg",
    imagenFuente: "Machupicchuterra",
    imagenLink: "https://www.machupicchuterra.com/es/puno/tour-islas-flotantes-uros/",
    cam: { x: 5, y: 1.80, z: 65 },
    look: { x: 7, y: -0.5, z: 53 }
  },
{
    titulo: "Mirador de las Islas Uros",
    texto: "En algunas islas hay torres hechas de totora a las que los visitantes pueden subir. Desde arriba se ve el contraste entre el azul del lago Titicaca y el verde intenso de las islas, y también cómo están ubicadas las casas, las balsas y los caminos de agua entre ellas. Desde uno de estos miradores también se puede ver cómo construyen las balsas. Subir a los miradores es parte de los tours a las islas y es una de las mejores formas de entender cómo está organizado el lugar. El Titicaca es el lago navegable más alto del mundo, a más de 3.800 metros sobre el nivel del mar, y esa altura se nota en el aire fresco, el frío y la luz fuerte del sol. Por eso este punto es uno de los favoritos para sacar fotos. Mirar el paisaje desde arriba ayuda a ver lo frágil y a la vez ingenioso que es vivir sobre una isla hecha a mano.",
    fuente: "La Tercera",
    fuenteLink: "https://www.latercera.com/diario-impreso/islas-flotantes-del-titicaca-el-mundo-de-totora-de-los-uros/",
    imagen: "imagenes/mirador.jpg",
    imagenFuente: "My guide Bolivia",
    imagenLink: "https://www.myguidebolivia.com/es/que-hacer/from-cusco-2-night-lake-titicaca-excursion",
    cam: { x: -32, y: 1.5, z: 25 },
    look: { x: -33, y: 1, z: 19 }
  },
{
    titulo: "Pez elaborado con Totora",
    texto: "La pesca y la caza de aves son parte importante de la vida de los Uros. En cada isla viven entre cinco y siete familias que se mantienen de lo que pescan y cazan, y lo venden o lo intercambian en el mercado de Puno. Entre los peces que capturan están el carachi y la trucha. Con la totora también hacen artesanías, como canastas, esteras, juguetes y figuras de animales, entre ellas peces. Las mujeres también tejen y bordan tapices de colores con escenas de la vida en las islas. Hoy venden todo esto a los visitantes, y es una fuente de ingreso importante junto con el turismo. Estas figuras recuerdan que el lago es su fuente de comida y la base de su cultura. Cuando alguien compra una, se lleva un pedazo de la tradición de los Uros y ayuda a que las familias sigan viviendo de su trabajo.",
    fuente: "Felices Vacaciones",
    fuenteLink: "https://blog.felicesvacaciones.es/que-hacen-los-uros",
    imagen: "imagenes/pez.jpg",
    imagenFuente: "Entorno Turistico",
    imagenLink: "https://www.entornoturistico.com/el-titicaca-el-lago-navegable-mas-alto-del-mundo/",
    cam: { x: 16.52, y: 1.80, z: 48.66 },
    look: { x: 28, y: -0.5, z: 36 }
  },
{
    titulo: "Arco de totora",
    texto: "En las islas hay arcos decorativos hechos de totora, y los visitantes suelen tomarse fotos debajo de ellos. La bienvenida suele ser formal: mujeres con ropa tradicional de colores vivos reciben a los visitantes con canciones, y el líder de la isla los saluda en su idioma. Después les explican cómo se construye la isla, cómo viven las familias y qué usan de la totora. Además de arcos, los Uros hacen con totora figuras de cóndores, letras, casas y botes. Todo esto muestra lo que pueden construir con un solo material, usando técnicas que se pasan de generación en generación. El arco funciona como una puerta simbólica que da la bienvenida a su mundo sobre el agua, y es uno de los lugares más fotografiados de las islas.",
    fuente: "Fertur Travel",
    fuenteLink: "https://www.fertur-travel.com/blog/2018/uros-floating-islands-peru/14010/",
    imagen: "imagenes/arco.jpg",
    imagenFuente: "123rf",
    imagenLink: "https://es.123rf.com/photo_10898183_arco-de-ca%C3%B1a-en-la-isla-de-los-uros-en-el-lago-navegable-m%C3%A1s-alto-del-mundo-titicaca.html",
    cam: { x: -10, y: 1, z: 12 },
    look: { x: -9, y: 0, z: 0 }
},
{
    titulo: "La totora",
    texto: "La totora (Schoenoplectus californicus) es una planta acuática parecida al junco que crece en las aguas poco profundas del lago Titicaca. Es la base de la vida de los Uros: con ella hacen las islas, las casas, los techos, las balsas e incluso los colchones. También se come, y en broma le dicen “banana del lago”. Se pela el tallo y se consume la parte blanca de adentro, que es tierna y fresca. Sus raíces tienen mucho yodo, se usa como medicina, y con sus flores se prepara té. Después de crecer entre año y medio y dos años, las raíces se sueltan solas del fondo y flotan, y entonces los Uros las cortan para hacer islas nuevas. Además de ser útil, la totora ayuda al lago porque sirve de refugio para peces y aves. Sin ella, la forma de vida de los Uros no existiría.",
    fuente: "Our Way of Life",
    fuenteLink: "https://ourwayoflife.co.nz/the-uros-islands-of-peru-explore-the-colourful-floating-village-made-of-reeds-in-lake-titicaca/",
    imagen: "imagenes/totora.jpg",
    imagenFuente: "Dreamstime",
    imagenLink: "https://es.dreamstime.com/totora-recubre-con-ca%C3%B1a-el-crecimiento-en-lago-titicaca-image131340511",
    cam: { x: -18, y: 0, z: 42 }, 
    look: { x: -15, y: -0.5, z: 40 }
},
{
    titulo: "El flamenco andino",
    texto: "El flamenco andino de totora es una figura artesanal inspirada en el flamenco que vive en las lagunas del altiplano. Está hecho con totora y representa la creatividad de las comunidades andinas y el aprovechamiento de los recursos naturales de su entorno. Este modelo busca destacar la belleza de la fauna andina y la importancia de la totora como parte de la cultura y las tradiciones de la región. Los flamencos son aves de patas largas y delgadas, cuello curvo y plumaje rosado. En el altiplano se los ve en lagunas y salares, donde se alimentan de pequeños organismos del agua. Su figura elegante los convierte en uno de los animales más reconocidos de los Andes. Para hacer el flamenco de totora se usan tallos secos, que se doblan y se atan para formar el cuerpo, el cuello largo y las patas. Las partes finas, como el cuello y las patas, se logran enrollando varios tallos juntos hasta que quedan firmes. Todo se hace a mano, sin clavos ni pegamento, con la misma técnica que se usa para las balsas y las casas. Los Uros hacen con totora muchas figuras de animales, como cóndores, peces y aves. Algunas son pequeñas y se venden como recuerdo, y otras son más grandes y se usan como adorno en las islas. Cada pieza muestra la habilidad de las familias para trabajar con un solo material. Estas artesanías también son una fuente de ingreso. Los visitantes las compran como recuerdo de las islas, y así las familias pueden seguir viviendo de su trabajo y mantener viva su tradición. El flamenco de totora une dos elementos del paisaje andino: la planta del lago y un ave que vive en sus aguas. Por eso es una buena muestra de cómo la cultura Uru se inspira en la naturaleza que la rodea.",
    fuente: "Felices Vacaciones",
    fuenteLink: "https://blog.felicesvacaciones.es/que-hacen-los-uros",
    imagen: "imagenes/floating-islands-urus-on-lake-600w-1786742297.jpg",
    imagenFuente: "Fertur Travel",
    imagenLink: "https://cl.pinterest.com/pin/322359285836696907/",
    cam: { x: -43.5, y: 2, z: -5 },
    look: { x: -40, y: 0, z: -11 }
}
];

const resaltables = cultura.map(() => []);
const marcar = (i, extra) => m => { resaltables[i].push(m); if(extra) extra(m); };

const zonas = [
    { x: 2,   z: 3, r: 12 },
    { x: 33,   z: -8,   r: 12 },
    { x: 2,  z: 53, r: 8  },
    { x: -38,  z: 17,   r: 14 },
    { x: 25,   z: 35,   r: 14 }, 
    { x: -8, z: 3.5,    r: 8  },
    { x: -15,  z: 38,   r: 7  },
    { x: -38, z: -14, r: 10 } 
];

const loader = new THREE.GLTFLoader();
const pendientes = {};

function colocar(base, x, y, z, sx, sy, sz, rotY, callback){
  const modelo = base.clone();
  modelo.position.set(x, y, z);
  modelo.scale.set(sx, sy, sz);
  modelo.rotation.y = rotY;
  scene.add(modelo);
  if (callback) callback(modelo);
}

function cargarModelo(ruta, x, y, z, sx, sy, sz, rotY = 0, callback = null) {
  const args = [x, y, z, sx, sy, sz, rotY, callback];
  if (cacheModelos[ruta]) return colocar(cacheModelos[ruta], ...args);
  if (pendientes[ruta]) return pendientes[ruta].push(args);

  pendientes[ruta] = [args];
  loader.load(ruta, function(gltf) {
    const base = gltf.scene;
    base.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.roughness = 0.85;
        child.material.metalness = 0.0;
      }
    });
    cacheModelos[ruta] = base;
    pendientes[ruta].forEach(a => colocar(base, ...a));
    delete pendientes[ruta];
  });
}

function moverCamara(){
    animCamara.inicio.copy(camera.position);
    animCamara.objetivo.set(cultura[paginaCultura].cam.x,cultura[paginaCultura].cam.y,cultura[paginaCultura].cam.z);
    animCamara.lookInicio.copy(destinoLook);
    animCamara.lookObjetivo.set(cultura[paginaCultura].look.x,cultura[paginaCultura].look.y,cultura[paginaCultura].look.z);
    animCamara.tiempo = 0;
    animCamara.activa = true;
}
function cameraReset(){
    animCamara.inicio.copy(camera.position);
    animCamara.objetivo.copy(INICIO_POS);
    animCamara.lookInicio.copy(destinoLook);
    animCamara.lookObjetivo.copy(INICIO_LOOK);
    animCamara.tiempo = 0;
    animCamara.activa = true;
}

function alternarNavegacion(){
    modoNavegar = !modoNavegar;
    if(barco2) barco2.visible = !modoNavegar;
    controls.enabled = !modoNavegar;
    document.getElementById("ayudaNavegar").style.display = modoNavegar ? "block" : "none";
    document.getElementById("contador").style.display = modoNavegar ? "block" : "none";
    document.getElementById("btnNavegar").innerText = modoNavegar ? "❌ Salir" : "⛵ Navegar";
    if(modoNavegar){
        animCamara.activa = false;
        document.getElementById("inicioInfo").style.display = "none";
    }else{
        cerrarTarjeta();
        iconos.forEach(d => d.style.display = "none");
        document.getElementById("inicioInfo").style.display = "block";
        cameraReset();
    }
}

function easeInOut(t){
    return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function actualizarInfo(i){
    const panel = document.getElementById("panelInfo");
    panel.classList.remove("izquierda", "derecha");
    panel.classList.add(i % 2 === 0 ? "derecha" : "izquierda");

    const c = cultura[i];
    document.getElementById("tituloInfo").innerHTML = c.titulo;
    document.getElementById("imagenInfo").src = c.imagen;
    const enlaceImg = document.getElementById("imagenFuenteInfo");
    if(c.imagenLink){
        enlaceImg.innerText = "Imagen: " + c.imagenFuente;
        enlaceImg.href = c.imagenLink;
        enlaceImg.style.display = "inline-block";
    }else{
        enlaceImg.style.display = "none";
    }
    document.getElementById("textoInfo").innerHTML = c.texto;
    const f = document.getElementById("fuenteLink");
    f.innerText = c.fuente;
    f.href = c.fuenteLink;
}

function actualizarAyuda(){
    const ver = modoNavegar && tarjetaAbierta < 0 && !pecesAbierto && !ubicacionAbierta;
    document.getElementById("ayudaNavegar").style.display = ver ? "block" : "none";
}

function abrirTarjeta(i){
    if(i < 0 || tarjetaAbierta >= 0) return;
    tarjetaAbierta = i;
    velBarco = 0;
    actualizarInfo(i);
    document.getElementById("panelInfo").style.display = "block";
    document.getElementById("ayudaNavegar").style.display = "none";
    vistas.add(i);
    document.getElementById("contador").innerText = "Descubiertos: " + vistas.size + " de " + cultura.length;

    iconos.forEach(d => d.style.display = "none");
    barcoJugador.visible = false;
    controls.enabled = true;
    paginaCultura = i;

    outlinePass.selectedObjects = resaltables[i];
    outlinePass.enabled = resaltables[i].length > 0;
    moverCamara();
}
function irATarjeta(i){
    cerrarPeces();
    cerrarUbicacion();
    if(tarjetaAbierta >= 0) cerrarTarjeta(false);
    document.getElementById("inicioInfo").style.display = "none";
    abrirTarjeta(i);
}

function cerrarTarjeta(volverInicio = true){
    if(tarjetaAbierta < 0) return;
    tarjetaAbierta = -1;

    outlinePass.enabled = false;
    outlinePass.selectedObjects = [];

    animCamara.activa = false;
    document.getElementById("panelInfo").style.display = "none";
    document.getElementById("ayudaNavegar").style.display = modoNavegar ? "block" : "none";
    if(barcoJugador) barcoJugador.visible = true;
    controls.enabled = !modoNavegar;

    if(!modoNavegar && volverInicio){
        document.getElementById("inicioInfo").style.display = "block";
        cameraReset();
    }
}

function crearIconos(){
    zonas.forEach((z, i) => {
        const d = document.createElement("div");
        d.className = "icono";
        d.style.display = "none";
        d.innerHTML = '<div class="punto">i</div><div class="etiqueta"></div>';
        d.querySelector(".etiqueta").innerText = cultura[i].titulo + " (E)";
        d.onclick = () => abrirTarjeta(i);
        document.getElementById("iconos").appendChild(d);
        iconos.push(d);
    });
}

function actualizarIconos(){
    const p = barcoJugador.position;
    zonaCerca = -1;
    let mejor = Infinity;
    zonas.forEach((z, i) => {
        const d = Math.hypot(p.x - z.x, p.z - z.z);
        if(d < z.r && d < mejor){ mejor = d; zonaCerca = i; }
    });

    camera.updateMatrixWorld();
    zonas.forEach((z, i) => {
        punto.set(z.x, 3, z.z).project(camera);
        const el = iconos[i];
        el.style.display = (punto.z < 1 && tarjetaAbierta < 0) ? "flex" : "none";
        el.style.left = (punto.x * 0.5 + 0.5) * window.innerWidth + "px";
        el.style.top = (-punto.y * 0.5 + 0.5) * window.innerHeight + "px";
        el.classList.toggle("cerca", i === zonaCerca);
    });
}


function crearLuzNoche(x, y, z){
    const luz = new THREE.PointLight(0xff6a1f, 0, 8);
    luz.position.set(x, y, z);
    scene.add(luz);
    luzNoche.push(luz);
}

// ===== Modal de peces (visor 3D propio) =====
let pecesListo = false, pecesAbierto = false, arrastrandoPeces = false, pecesUltX = 0;
let pecesScene, pecesCam, pecesRenderer, pecesGrupo;
const pecesMixers = [];
const pecesReloj = new THREE.Clock();

function cargarPez(ruta, x, y, z, rotY){
    loader.load(ruta, gltf => {
        const m = gltf.scene;
        m.position.set(x, y, z);
        m.rotation.y = rotY;
        if(gltf.animations.length){
            const mixer = new THREE.AnimationMixer(m);
            gltf.animations.forEach(c => mixer.clipAction(c).play());
            pecesMixers.push(mixer);
        }
        pecesGrupo.add(m);
    });
}

function iniciarPeces(){
    const visor = document.getElementById("visorPeces");
    pecesScene = new THREE.Scene();
    pecesCam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    pecesCam.position.set(0, 3, 8);
    pecesCam.lookAt(0, 0, 0);

    pecesRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    pecesRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    visor.appendChild(pecesRenderer.domElement);

    pecesScene.add(new THREE.AmbientLight(0xffffff, 3));
    const luz = new THREE.DirectionalLight(0xffffff, 0.8);
    luz.position.set(10, 20, 10);
    pecesScene.add(luz);

    pecesGrupo = new THREE.Group();
    pecesScene.add(pecesGrupo);

    cargarPez("99ezanimation.glb", 0,    0,    0,   -98 * Math.PI/180);
    cargarPez("99ezanimation.glb", 0,    0.3,  0,    50 * Math.PI/180);
    cargarPez("99ezanimation.glb", 0,    0.3,  0,   180 * Math.PI/180);
    cargarPez("pez3.glb",         -1,   -0.4,  1.5,  0);
    cargarPez("pez3.glb",          0.5, -0.4, -1,   150 * Math.PI/180);
    cargarPez("pez3.glb",         -2,   -0.4, -2,   250 * Math.PI/180);

    const cv = pecesRenderer.domElement;
    cv.addEventListener("pointerdown", e => { arrastrandoPeces = true; pecesUltX = e.clientX; });
    window.addEventListener("pointerup", () => arrastrandoPeces = false);
    cv.addEventListener("pointermove", e => {
        if(!arrastrandoPeces) return;
        pecesGrupo.rotation.y += (e.clientX - pecesUltX) * 0.01;
        pecesUltX = e.clientX;
    });
    window.addEventListener("resize", () => { if(pecesAbierto) ajustarVisorPeces(); });
    pecesListo = true;
}

function ajustarVisorPeces(){
    const v = document.getElementById("visorPeces");
    const w = v.clientWidth, h = v.clientHeight;
    pecesRenderer.setSize(w, h);
    pecesCam.aspect = w / h;
    pecesCam.updateProjectionMatrix();
}

function animarPeces(){
    if(!pecesAbierto) return;
    requestAnimationFrame(animarPeces);
    const dt = pecesReloj.getDelta();
    pecesMixers.forEach(m => m.update(dt));
    if(!arrastrandoPeces) pecesGrupo.rotation.y += 0.005;
    pecesRenderer.render(pecesScene, pecesCam);
}

function abrirPeces(){
    if(pecesAbierto) return;
    if(ubicacionAbierta) cerrarUbicacion();
    if(tarjetaAbierta >= 0) cerrarTarjeta();
    pecesAbierto = true;
    document.getElementById("modalPeces").style.display = "flex";
    if(!pecesListo) iniciarPeces();

    aplicarFondoPeces();

    ajustarVisorPeces();
    pecesReloj.getDelta();
    animarPeces();
    actualizarAyuda();
}

function cerrarPeces(){
    pecesAbierto = false;
    document.getElementById("modalPeces").style.display = "none";
    actualizarAyuda();
}

let ubicacionAbierta = false;

function abrirUbicacion(){
    if(ubicacionAbierta) return;
    if(pecesAbierto) cerrarPeces();
    if(tarjetaAbierta >= 0) cerrarTarjeta(false);
    ubicacionAbierta = true;
    document.getElementById("modalUbicacion").style.display = "flex";
    actualizarAyuda();
}

function cerrarUbicacion(){
    ubicacionAbierta = false;
    document.getElementById("modalUbicacion").style.display = "none";
    actualizarAyuda();
}

function irAInicio(){
    cerrarPeces();
    cerrarUbicacion();
    if(tarjetaAbierta >= 0) cerrarTarjeta(false);
    if(modoNavegar) alternarNavegacion();
    else{
        document.getElementById("inicioInfo").style.display = "block";
        cameraReset();
    }
}

function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
  camera.position.copy(INICIO_POS);
  destinoLook.copy(INICIO_LOOK);
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth,window.innerHeight);

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.getElementById("contenedor3D").appendChild(renderer.domElement);  
 
  let luzAmbiental = new THREE.AmbientLight(0xffffff, 1);
  scene.add(luzAmbiental);
  
  luzDir2 = new THREE.DirectionalLight(0xffffff, 1.2); 
  luzDir2.position.set(10, 20, 10);
  scene.add(luzDir2);

  // isla Medio
  cargarModelo("islaMedio.glb", -3, -1.8, -1.5, 1, 1, 1, -98 * Math.PI / 180,  marcar(0, m => registrarIsla(m, 1.8)));
  cargarModelo("barco3.glb",-25, 0, 10,0.6, 0.6, 0.6,1,function(modelo){barco2 = modelo;});

  cargarModelo("casa1_totora.glb", -2.6, -1.9, -4.9, 1, 1, 1, -102 * Math.PI / 180,marcar(0));
  cargarModelo("casa1_totora.glb", -8.7, -1.9, -4.8, 1, 1, 1, -85 * Math.PI / 180,marcar(0));
  cargarModelo("casa1_totora.glb", -13.3, -1.9, -0.2, 1, 1, 1, -55 * Math.PI / 180,marcar(0));
  cargarModelo("casa1_totora.glb", 2.7, -1.9, -3.2, 1, 1, 1, -145 * Math.PI / 180,marcar(0));
  cargarModelo("casa2_totora.glb", 2.6, -1.9, 5, 1, 1, 1, -130 * Math.PI / 180,marcar(0));
  cargarModelo("arco_totora.glb", -2.5, -1.9, -1, 1, 1, 1, -102 * Math.PI / 180,marcar(5));
  cargarModelo("mirador.glb", -2.5, -1.9, -1, 1, 1, 1, -102 * Math.PI / 180,marcar(0));
  cargarModelo("flamenco.glb", -2.5, -1.9, -2, 1, 1, 1, -102 * Math.PI / 180,marcar(0));

  // isla izquierda adelante
  cargarModelo("islaFrenteIzq.glb", -38, -1.8, 17, 1, 1, 1,-62 * Math.PI / 180, m => registrarIsla(m, 1.8));

  cargarModelo("casa1_totora.glb", -41.2, -1.9, 24, 1, 1, 1, -50 * Math.PI / 180);
  cargarModelo("casa2_totora.glb", -37, -1.9, 20, 1, 1, 1, -50 * Math.PI / 180);
  cargarModelo("mirador.glb", -34, -1.9, 6.5, 1, 1, 1, -20 * Math.PI / 180,marcar(3));

  // isla derecha adelante
  cargarModelo("islaFrenteDer.glb", 25, -1.8, 35, 1, 1, 1, -152 * Math.PI / 180, m => registrarIsla(m, 3));

  cargarModelo("casa1_totora.glb", 15, -1.9, 34.5, 1, 1, 1, -90 * Math.PI / 180);
  cargarModelo("casa1_totora.glb", 25.2, -1.9, 35.3, 1, 1, 1, -150 * Math.PI / 180);
  cargarModelo("casa2_totora.glb", 21.5, -1.9, 32.2, 1, 1, 1, -120 * Math.PI / 180);
  cargarModelo("casa2_totora.glb", 26.5, -1.9, 40, 1, 1, 1, -180 * Math.PI / 180);
  cargarModelo("pez_totora.glb", 25, -1.9, 35, 1, 1, 1, -150 * Math.PI / 180,marcar(4));

  // isla izquierda
  cargarModelo("islaFrenteIzq.glb", -40, -1.8, -16, 1, 1, 0.9,-100 * Math.PI / 180, m => registrarIsla(m, 1.8));
  cargarModelo("flamenco.glb", -35.5, -1.9, -19.8, 1, 1, 1, -130 * Math.PI / 180,marcar(7));
  cargarModelo("casa1_totora.glb", -44, -1.9, -11, 1, 1, 1, -60 * Math.PI / 180);

  // isla derecha
  cargarModelo("islaDer.glb", 33, -1.8, -8, 1, 1, 1, -120 * Math.PI / 180,m => registrarIsla(m, 1.8));

  cargarModelo("casa1_totora.glb", 31, -1.9, -7, 1, 1, 1, -135 * Math.PI / 180, marcar(1));
  cargarModelo("casa2_totora.glb", 26, -1.9, -9, 1, 1, 1, -120 * Math.PI / 180, marcar(1));
  
  // barcos
  cargarModelo("islaIzq.glb", 0, -1.8, 53, 1.3, 1.3, 1.3, -98 * Math.PI / 180, marcar(2, m => registrarIsla(m, 1.8)));


  crearLuzNoche(-3, 2, -1.5);      // isla medio
  crearLuzNoche(-38, -1.3, 17);    // isla frente izq
  crearLuzNoche(25, -1.3, 35);     // isla frente der
  crearLuzNoche(0, -1.3, 53);      // barcos
  crearLuzNoche(33, -1.3, -8);     // isla der
  crearLuzNoche(-40, 2, -13);      // isla izq
  // totora 
  cargarModelo("planta.glb", -13.5, -2,39, 0.4, 0.3, 0.4, 1,marcar(6));
  cargarModelo("planta.glb", -14, -2,38.5, 0.4, 0.3, 0.4, 1,marcar(6));
  cargarModelo("planta.glb", -14.5, -2,38, 0.4, 0.3, 0.4, 1,marcar(6));
  cargarModelo("planta.glb", -15, -2,37.5, 0.4, 0.3, 0.4, 1,marcar(6));
  cargarModelo("planta.glb", -15.5, -2,37, 0.4, 0.3, 0.4, 1,marcar(6));
  cargarModelo("planta.glb", -16, -2,36.5, 0.4, 0.3, 0.4, 1,marcar(6));
  cargarModelo("planta.glb", -16.5, -2,36, 0.4, 0.3, 0.4, 1,marcar(6));
  cargarModelo("planta.glb", -17, -2,35.5, 0.4, 0.3, 0.4, 1,marcar(6));
 
  cargarModelo("barco3.glb", -12, -2, 65, 0.6, 0.6, 0.6, 3, function(modelo){barcoJugador = modelo;});

  const aguaGeometry = new THREE.PlaneGeometry(400, 400);
  water = new THREE.Water(aguaGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
          'https://threejs.org/examples/textures/waternormals.jpg',
          function (textura) {
              textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
          }
      ),
      sunDirection: luzDir2.position.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x164a5c, 
      distortionScale: 1.8,
      fog: scene.fog !== undefined
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = -2;
  scene.add(water);


  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;


  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  
  outlinePass = new THREE.OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera
  );
  outlinePass.edgeStrength = 3;
  outlinePass.edgeThickness = 2;
  outlinePass.edgeGlow = 0.5;
  outlinePass.pulsePeriod = 3;
  outlinePass.visibleEdgeColor.set("#E4D96F");
  outlinePass.hiddenEdgeColor.set("#E4D96F");
  outlinePass.enabled = false;
  composer.addPass(outlinePass);
  
  window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
  });

  cambiarAmbiente("noche");
  crearIconos();
}
function animate() {
  
 if(animCamara.activa){
    animCamara.tiempo += 0.016;
    let t = animCamara.tiempo / animCamara.duracion;
    if(t >= 1){
        t = 1;
        animCamara.activa = false;
    }
    const e = easeInOut(t);
    camera.position.lerpVectors(animCamara.inicio,animCamara.objetivo,e);

    destinoLook.lerpVectors(animCamara.lookInicio,animCamara.lookObjetivo,e);
  }
  camera.lookAt(destinoLook);
  requestAnimationFrame(animate);

  tiempo += 0.02;
  if (water) {
    water.material.uniforms['time'].value += 0.6 / 60.0;
  }

  if (barco2) {
  barco2.position.x += 0.010;
  barco2.position.z += 0.025;
  barco2.position.y = -2 + Math.sin(tiempo * 2) * 0.08;

  barco2.rotation.y = 120 * Math.PI / 180;

  if (barco2.position.x > 55 || barco2.position.z > 55) {
      barco2.position.x = -25;
      barco2.position.z = 10;
    }
}

if(modoNavegar && barcoJugador && tarjetaAbierta < 0){
    
    if(teclas["w"] || teclas["arrowup"]) velBarco += 0.005;
    else if(teclas["s"] || teclas["arrowdown"]) velBarco -= 0.005;
    else velBarco *= 0.97;
    velBarco = Math.max(-0.08, Math.min(0.25, velBarco));
    if(teclas["a"] || teclas["arrowleft"]) rotBarco += 0.025;
    if(teclas["d"] || teclas["arrowright"]) rotBarco -= 0.025;
    

    barcoJugador.position.x += Math.sin(rotBarco) * velBarco;
    barcoJugador.position.z += Math.cos(rotBarco) * velBarco;
    barcoJugador.position.x = Math.max(-150, Math.min(150, barcoJugador.position.x));
    barcoJugador.position.z = Math.max(-150, Math.min(150, barcoJugador.position.z));
    barcoJugador.position.y = -2 + Math.sin(tiempo * 2) * 0.08;
    barcoJugador.rotation.y = rotBarco + AJUSTE_ROT;

    const camObjetivo = new THREE.Vector3(
        barcoJugador.position.x - Math.sin(rotBarco) * 10,
        3,
        barcoJugador.position.z - Math.cos(rotBarco) * 10
    );
    camera.position.lerp(camObjetivo, 0.08);
    destinoLook.set(barcoJugador.position.x, 0, barcoJugador.position.z);

    actualizarIconos();

    const margen = 0.5;
    const p = barcoJugador.position;
    for(const caja of islasCajas){
        const izq = p.x - (caja.min.x - margen);
        const der = (caja.max.x + margen) - p.x;
        const atr = p.z - (caja.min.z - margen);
        const adl = (caja.max.z + margen) - p.z;
        if(izq > 0 && der > 0 && atr > 0 && adl > 0){
            const m = Math.min(izq, der, atr, adl);
            if(m === izq) p.x = caja.min.x - margen;
            else if(m === der) p.x = caja.max.x + margen;
            else if(m === atr) p.z = caja.min.z - margen;
            else p.z = caja.max.z + margen;
            velBarco *= 0.5;
        }
    }
}

controls.target.copy(destinoLook);
controls.update();

if(camera.position.y < -1){
    camera.position.y = -1;
}

//   renderer.render(scene, camera);
composer.render();
}
init();
animate();