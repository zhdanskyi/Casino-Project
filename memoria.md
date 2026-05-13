Memoria Técnica de Proyecto
Módulo: Lenguaje de Marcas / Desarrollo Web en Entorno Cliente
Ciclo: Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)

El proyecto CasinoHub nace de la ambición de fusionar el entretenimiento digital clásico con una estética visual vanguardista basada en el movimiento Cyberpunk. En un mercado saturado de interfaces convencionales, CasinoHub propone una experiencia de usuario o UX (cómo interactúa y se siente el usuario al navegar) inmersiva que evoca un futuro distópico, utilizando una paleta de colores neón, efectos de glassmorphism (efecto visual CSS que simula cristal esmerilado) y animaciones dinámicas. (bootstrap) (mellstroy casino) [Ubicación: /css/styles.css y /css/modal.css]
 - styles.css: Es la raíz de los estilos. Define las variables globales (colores neón, fuentes), el reset de la página y los estilos base del cuerpo.
modal.css: Estilos exclusivos para las ventanas emergentes (login, depósito, perfil). Gestiona el efecto de cristal (glassmorphism).

Técnicamente, el proyecto se plantea como un reto de desarrollo frontend puro (construir solo la parte visual e interactiva del cliente), prescindiendo de frameworks pesados para demostrar el dominio de las tecnologías base: HTML5, CSS3 y JavaScript Moderno (ES6+). La elección de esta temática no es solo estética; permite explorar técnicas avanzadas de manipulación del DOM (Document Object Model, modificar el HTML en tiempo real con código) y gestión de estados complejos en el cliente.

El desarrollo de CasinoHub se fundamenta en los siguientes objetivos estratégicos:

Experiencia Inmersiva: Implementar una interfaz de alto impacto visual que mantenga la coherencia temática en cada interacción, utilizando animaciones fluidas y feedback visual constante. [Ubicación: /css/animations.css]
 - animations.css: Contiene todos los keyframes. Se aplica a los efectos de entrada de los juegos y al brillo de los botones.

Persistencia en Cliente: Gestionar el ciclo de vida de los datos (perfiles de usuario, saldos, transacciones y estatus VIP) de forma eficiente mediante el uso de la API de localStorage (la base de datos interna del navegador), garantizando que la información perdure entre sesiones sin necesidad de un backend complejo.

Diseño Responsive y Adaptativo: Asegurar que la plataforma sea plenamente funcional y visualmente atractiva en una amplia gama de dispositivos, aplicando principios de Mobile First (diseñar primero pensando en la pantalla del móvil). [Ubicación: /css/responsive.css]
 - responsive.css: Contiene las @media queries. Ajusta el tamaño de los elementos para que se vea bien en móviles.

Optimización de Rendimiento: Minimizar los tiempos de carga y asegurar una tasa de refresco constante mediante un código limpio y optimizado.

Para garantizar la mantenibilidad y escalabilidad del proyecto, se ha optado por una arquitectura modular (dividir el proyecto en archivos pequeños según su función en lugar de un archivo único). A continuación, se detalla la organización del directorio raíz:

Directorios Principales:

/css: Contiene la lógica de estilos fragmentada por responsabilidades (layout, animaciones, modales, juegos, etc.). Esta segmentación evita la creación de archivos monolíticos difíciles de depurar y facilita la reutilización de componentes visuales.

/js: Núcleo lógico de la aplicación. Se divide en módulos especializados:

storage.js: Encapsula la lógica de persistencia y comunicación con el localStorage.

STORAGE.JS:
1. El concepto de "Base de Datos" en el navegador
Usamos localStorage. El problema es que localStorage solo sabe guardar texto plano. Por eso verás mucho estas dos funciones:

JSON.parse(): para convertir el texto que sacamos del navegador en un objeto de JavaScript con el que podamos trabajar (sumar dinero, leer el nombre, etc.).
JSON.stringify(): para convertir nuestros objetos de nuevo a texto y poder "meterlos" en el cajón del navegador sin que den error.
2. Las dos llaves maestras
dbKey ('casino_users_db'): es el cajón donde guardamos a todos los usuarios que se han registrado en tu PC.
sessionKey ('casino_current_session'): es un papelito donde apuntamos el nombre del usuario que está jugando ahora mismo. Así, si cierras la pestaña y vuelves, la web sabe quién eres.
3. ¿Qué hacen las funciones principales?
getAllUsers(): abre el cajón de todos los usuarios. Si está vacío, te devuelve una lista vacía [].
getUser(): mira quién tiene la sesión abierta y lo busca en la lista de todos los usuarios para darte toda su info (su saldo, su avatar, etc.).
registerUser(username): crea un usuario nuevo. Fíjate que le regalamos 1000 pavos (balance: 1000.00) para que empiece a jugar. También le crea un avatar aleatorio con una API externa.
updateBalance(amount): esta es la más importante. Se usa tanto para cuando ganas dinero como para cuando apuestas (le pasas un número negativo). Además, guarda un registro en user.transactions para que luego el usuario pueda ver su historial de movimientos.

ui.js: Gestiona la manipulación del DOM y la actualización de la interfaz en tiempo real.

router.js: Controla la navegación interna de la aplicación.

app.js: Punto de entrada que coordina el arranque de los distintos módulos.

/pages: Almacena las diferentes secciones o vistas de la aplicación (aviator.html, mines.html), permitiendo una carga dinámica de contenidos y una mejor organización estructural del marcado HTML.

/assets: Repositorio de recursos estáticos como imágenes y fuentes personalizadas que refuerzan la identidad visual cyberpunk.

/models y /utils: Carpetas destinadas a la definición de estructuras de datos y funciones de utilidad transversales, reforzando el Single Responsibility Principle (Principio de Responsabilidad Única: cada archivo cumple una sola función).

La lógica de negocio de CasinoHub se fundamenta en una estricta separación de responsabilidades (Separation of Concerns). Para lograrlo sin depender de un servidor externo, se ha implementado un flujo de datos que simula un entorno Full-Stack operando íntegramente en el cliente:

Persistencia Simulada: Este módulo actúa como la capa de datos. Utiliza la API de localStorage para serializar en formato JSON (convertir datos a texto plano para su almacenamiento) el estado global de la aplicación. Gestiona de forma segura operaciones críticas como la creación de perfiles, actualización de saldos, control del estatus VIP y registro del historial de transacciones. [Ubicación: /js/storage.js]

Reactividad de la Interfaz: Actúa como la capa de presentación. En lugar de recargar la página tras cada acción, este módulo se encarga de actualizar el DOM de forma dinámica. Lee los datos proporcionados por storage.js y renderiza los cambios visuales en tiempo real (por ejemplo, animando la subida del saldo en el topbar). [Ubicación: /js/ui.js]

Durante la fase de desarrollo e integración de los módulos, se detectó y solucionó un problema crítico relacionado con la gestión de la memoria (Memory Leak o fuga de memoria por acumulación de procesos), específicamente en el modal de transacciones económicas de la billetera.

Descripción del Bug:
Al interactuar con los botones de incremento rápido de saldo (+10, +100) y el botón de confirmación, el sistema ejecutaba las sumas de forma exponencial. El análisis del código reveló que el problema radicaba en la asignación de escuchadores de eventos mediante el método .addEventListener('click') dentro de las funciones de inicialización. Cada vez que se renderizaba o abría la vista, se apilaba un nuevo listener (manejador de eventos invisible) en el mismo nodo del DOM sin destruir el anterior.

Solución Técnica:
Para garantizar la idempotencia de los botones (que la operación produzca exactamente el mismo resultado sin importar si hay fallos previos) y limpiar la memoria, se refactorizó la asignación de eventos:

Se sustituyó el uso de .addEventListener por la asignación directa de propiedades de eventos (.onclick = () => {...}). [Ubicación: /js/ui.js -> función initWalletLogic()]

Esta decisión arquitectónica asegura que el motor de JavaScript sobrescriba cualquier función de callback anterior en ese nodo, garantizando que exista un único manejador de eventos activo por botón.

Esta corrección no solo resolvió el error matemático en los saldos, sino que optimizó el consumo de memoria del navegador, demostrando buenas prácticas en el manejo del DOM y en la prevención de eventos huérfanos.