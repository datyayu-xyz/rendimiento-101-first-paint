# Rendimiento Web 101 - First paint

En el mundo web actual, donde [los moviles se han vuelto mas populares que los desktops](http://gs.statcounter.com/press/android-overtakes-windows-for-first-time) y la mayoria de los usuarios esperan una experiencia rapida y nativa de las aplicaciones web, aun cuando la mayoria no cuenta con dispositivos de gama-alta, el rendimiento de los sitios se ha vuelto cada vez mas importante e imprecindible para garantizar una experiencia buena a nuestros usuarios. Aun asi, una gran parte de los desarrolladores web ignoran este tema y con las buenas practicas actualizandose constantemente, se vuelve complicado en ocasiones saber que podemos hacer para mejorar en ese aspecto. Por eso, en esta serie de posts acerca de rendimiento quiero enfocarme en temas importantes y soluciones actuales que pueden ayudarte a que tus usuarios tengan una experiencia optima y accesible al usar tu sitio.

*El repo con los ejemplos este post está disponible en [github]() para cualquier duda que tengas o mejora que quieras agregar, así que no dudes en hacerlo!*

---

Actualmente, hacer esperar a un usuario es perder a ese usuario. Nuestros usuarios necesitan recibir algun tipo de informacion rapidamente o se aburriran y dejaran el sitio. [Un estudio de Google del an_o pasado](https://www.doubleclickbygoogle.com/articles/mobile-speed-matters/) revelo que **el 53% de los usuarios abandonan sitios que tardan mas de 3 segundos en cargar**. Yep, solo toma 3 segundos para que perdamos a un posible cliente o usuario. Asi de impacientes nos hemos vuelto al consumir contenido.

Una de las estrategias mas populares para atacar este problema es la carga progresiva. Aqui hay un ejemplo:

![](PROGRESIVE_VS_NORMAL)

En la izquierda tenemos la manera "tradicional" de cargar sitios. Basicamente el navegador descarga todos los archivos que necesita y ya que los tiene renderiza toda la pagina de golpe.

El segundo ejemplo es la manera "progresiva" de cargar sitios o aplicaciones. En este caso, el navegador solamente obtiene una parte del contenido del sitio, lo muestra y conforme va obteniendo el resto, lo va renderizando.

La diferencia entre estas dos formas de cargar es la percepcion del usuario. Ciertamente puede que ambas versiones tomen el mismo tiempo antes de estar "completas", pero **el hecho de que el usuario obtenga informacion desde mucho antes, ayuda a disminuir la percepcion de tiempo del usuario y con ello su frustracion**, por lo que es mas suceptible a esperar a que termine de cargar la pagina si continuamente ve que hay algun tipo de progreso.

Hay distintos factores que se involucran en la carga progresiva de un sitio, pero en este post nos enfocaremos en el que el probablemente tiene mayor impacto: **el first paint**.


## First paint
El first paint, o primera pintada, es la primera vez que se muestra contenido en la pantalla cuando se esta cargando una pagina. Este es muy importante ya que mantiene el enfoque del usuario en el sitio cuando lo visita. Si tu first paint toma mucho tiempo el usuario solamente vera una pantalla vacia, lo que puede producir cierta frustacion y termine por alejar al usuario de tu sitio. Es por esto que siempre **debes procurar que tu first paint tome tan poco tiempo como sea posible.**

![]()


## Porque es lento?
Aqui hay un ejemplo sencillo de una pagina

![](GITHUB_PAGES_IFRAME_HERE)

Si revisamos esto con las devtools de chrome puedes ver el tiempo que toma en cargar. Aqui yo lo he restringido a 3G-Malo para hacer mas facil de distinguir los tiempos, pero considera que este puede ser un caso real, ya que la mayoria de los usuarios no tienen siempre buena conexion.

![](PAGE_TIMELINE)

Si revisas, solamente cargamos 4 archivos: el html, el css, javascript y una imagen. Sin embargo, el navegador espera hasta que tenga tanto el javascript como el css antes de comenzar a renderizar la pagina. Esto es bastante malo ya que si tenemos archivos de css y js pesados, significa que el navegador va a tardar mas en empezar a renderizar la pagina.

Es debido a este comportamiento que se dice que css y js bloquean el renderizado. Pero ahora que sabemos cual es el problema y el por que sucede, podemos ver como solucionarlo.

## Como desbloquear css
La mejor manera de desbloquear css es siguiendo dos reglas:

- Embedir el css critico en el html.
- Injectar el resto dinamicamente.

La manera en que esto funciona es que separes los estilos mas importantes o "criticos" de tu aplicacion y los pongas directamente en la cabecera del html:
```html
<head>
    ...
    <style>
        body {
            background-color: gray;
        }

        .header {
            color: white;
            background-color: red;
            height: 5em;
            width: 100vw;
        }
    </style>
</head>
```

De esta manera cuando el navegador descargue el archivo de html tendra acceso directo al html sin tener que esperar a que otras peticiones se realicen. Por lo que al mostrar el contenido inicialmente puede hacerlo ya con estilos pero sin tardar mas de lo necesario.

Pero que pasa con el resto del css, la parte que no es "critica"? Bueno, la mejor manera de tratar con esto es injectarlo dinamicamente usando javascript. Hay muchas maneras de hacer esto pero aqui hay un ejemplo:

```html
<script>
    function loadCSS(url, target, mediaType){
        var linkElement = window.document.createElement("link");
        var targetElement = target || window.document.getElementsByTagName("script")[0];

        linkElement.rel = "stylesheet";
        linkElement.href = url;
        linkElement.media = "only x";

        targetElement.parentNode.insertBefore(linkElement, targetElement);

        setTimeout(function(){ linkElement.media = mediaType || "all" })
    }

    loadCSS('estilos/estilos-no-criticos.css');
</script>
```
Basicamente lo que sucede aqui es que creamos un elemento `link` y le agregamos los atributos `rel="stylesheet"`, `href="TU_URL"` y `media="only x"` (dandonos como resulado: `<link rel="stylesheet" href="TU_URL" media="only x">`) y lo montamos en el DOM.

El truco aqui es que, al renderizar, el navegador ignora los estilos que tengan `media` con un valor que no aplique a la situacion actual. Aprovechando esto, usamos `media="only x"`, sabiendo que `only x` no es un valor correcto de `media`, por lo que va a ser ignorado y no va a bloquear el rendering. Pero inmediatamete (usando `setTimeout`) ponemos ese valor de manera asincrona a `all`, lo cual va a hacer que lo tome en cuenta para posteriores repintadas pero no bloqueamos la inicial, lo cual es excelente ya que ahora no tenemos que esperar a que descargue el css no-critico para mostrarle algo al usario.

Por supuesto, esta es la manera manual de aplicar estas tecnicas pero existen herramientas como [critical](https://github.com/addyosmani/critical) y [grunt-critical](https://github.com/bezoerb/grunt-critical) que pueden hacer estas tareas automaticamente como parte de tu proceso de build.


## Como desbloquear javascript

Desbloquear javascript es super sencillo y no hace falta hacer mas que agregar un atributo a tu etiqueta de script. Sin embargo, existen dos metodos, cada uno con sus ventajas y desventajas:

### Async
El primer metodo es agregarle async a tu etiqueta de script:
```html
<script src="./mi-script-1.js" async></script>
<script src="./mi-script-2.js" async></script>
```

Lo que sucede es que el navegador realiza peticiones por los scripts pero continua sin bloquear al documento y ejecuta los scripts en cuanto terminan de descargarse.

![](CHART_TIMELINE)

Esto es bueno ya que podemos ejecutar los scripts inmediatamente bloqueando lo menos posible el rendering inicial de la pagina. Sin embargo, esto tiene un problema y es que debido a que ejecuta los scripts inmediatamente despues de terminar de descargarlos, pudieran ser ejecutados en un orden diferente al que estan especificados en el documento de html. Es decir, `mi-script-2.js` puede que se ejecute antes que `mi-script-1.js`. Esto es particularmente malo si un script depende de otro (por ejemplo, tu codigo puede depender de jQuery haya sido cargado antes).

Por el problema anterior, solamente es recomendado usar este metodo para scripts que son totalmente independientes de otros. Un ejemplo claro de esta situacion es el script Google Analytics, ya que es totalmente auto-contenido y no lo usamos en nuestra aplicacion.

# Defer

Para los casos en los que dependemos de otros scripts tenemos `defer`.
```html
<script src="./mi-script-1.js" defer></script>
<script src="./mi-script-2.js" defer></script>
```

`defer` funciona similar a sync, en el sentido que realiza peticiones paralelas y no bloquea el rendering del navegador, la diferencia es que `defer` espera a que se termine de ejecutar el parseo y despues ejecuta los scripts en el orden que estan especificados en documento.

![](CHART_TIMELINE)

Este metodo es por lo general mas practico y garantiza el hecho de que jamas bloqueara el parser de html, a diferencia de `async`. Por lo que por lo general es mejor utilizar este metodo ya que es mas seguro.

# Single Page Applications y Server-Side rendering.
Cabe aclarar que los consejos anteriores solo aplican cuando el contenido es renderizado desde el servidor. Si tu pagina, utiliza algun un framework como AngularJS o una libreria como React para todo su contenido, el navegador aun tiene que esperar a que ejecute tus scripts ya que ellos son los que crean y montan ese contenido dinamicamente en el DOM. Apesar de todas las ventajas que este tipo de sistemas nos brindan, tambien pueden terminar siendo inclusive peor para nuestra experiencia inicial ya que el navegador no solo tiene que esperar hasta que termine de descargar y parsear el contenido antes de comenzar a renderizarlo, sino que tambien tiene que ejecutar el javascript antes de que el usuario pueda ver algo en la pantalla.

Para estos casos, lo mejor es utilizar Server-side rendering (rendering en el servidor), que basicamente lo que hace es pre-renderizar el contenido que va a generarse por javascript desde el servidor y nos envia un html con ese contenido ya inyectado. No quiero entrar en detalles en este tema, ya que cada framework o libreria tiene una manera distinta de hacerlo, pero si quieres optimizar el first paint de tu single-page application lo mas seguro es que este sea uno de los puntos mas importantes a tener en cuenta.

---

Resumiendo:
- Coloca tu css critico directo en el html.
- Carga el resto del css de manera asincrona.
- Asegurate de que tus scripts utilicen `async` o `defer`.
- De ser necesario, utiliza server-side rendering.

Siguiendo estos pasos, tu first paint sera mas rapido y la experencia de usuario sera mejor y mas rapida.


El repo con los ejemplos este post está disponible en [github]() para cualquier duda que tengas o mejora que quieras agregar, así que no dudes en hacerlo!
