# React-GPS-app
Aplicación de seguimiento en tiempo real con Leaflet y OpenStreetMap. Muestra la ubicación actual con marcadores personalizados, precisión, y diseño moderno. Incluye autenticación, sincronización con servidor, y modos activo/pasivo. Ideal para rastrear vehículos o dispositivos con datos precisos y fácil visualización.
Aquí tienes el tutorial para usar tu aplicación React-GPS-app:
Tutorial de uso de React-GPS-app
1. Instalación de dependencias

Para empezar, clona el repositorio y navega a la carpeta del proyecto en tu terminal:

git clone https://github.com/tu-repositorio/react-gps-app.git
cd react-gps-app

Luego, instala las dependencias necesarias:

npm install

2. Configuración del servidor

La aplicación está diseñada para interactuar con un servidor que sincroniza las ubicaciones. Si no tienes un servidor configurado, necesitarás uno para que la sincronización en tiempo real funcione correctamente. Asegúrate de que el servidor esté corriendo y accesible.
3. Variables de entorno

Antes de ejecutar la aplicación, crea un archivo .env en la raíz de tu proyecto y configura las siguientes variables:

REACT_APP_SERVER_URL=https://tu-servidor.com
REACT_APP_GOOGLE_MAPS_API_KEY=tu-clave-de-api

4. Ejecución de la aplicación

Para iniciar la aplicación en desarrollo, utiliza el siguiente comando:

npm start

La aplicación se abrirá en tu navegador en la dirección http://localhost:3000.
5. Características

    Seguimiento en tiempo real: La aplicación muestra la ubicación actual de los dispositivos o vehículos en un mapa interactivo utilizando Leaflet y OpenStreetMap.

    Marcadores personalizados: Puedes visualizar la ubicación con íconos y colores personalizados para identificar fácilmente cada dispositivo.

    Modos activo/pasivo: La app permite cambiar entre modos de seguimiento activo o pasivo, lo cual es útil dependiendo del tipo de seguimiento que necesites.

    Autenticación: La app incluye un sistema de autenticación para acceder a los datos de ubicación, permitiendo tener diferentes niveles de acceso.

6. Uso del mapa

Una vez iniciada la aplicación, verás un mapa con tu ubicación actual. El mapa se actualizará en tiempo real mostrando:

    Marcadores de ubicación: Cada dispositivo o vehículo rastreado tendrá su propio marcador.
    Observación de ubicaciones históricas: Si tienes acceso, puedes ver las ubicaciones previas a medida que se sincronizan con el servidor.

7. Cambiar entre modos

La aplicación incluye dos modos:

    Modo activo: El dispositivo está enviando constantemente su ubicación al servidor.
    Modo pasivo: El dispositivo solo envía su ubicación en intervalos preestablecidos.

Para cambiar de modo, simplemente selecciona el ícono en la barra de navegación de la app.
