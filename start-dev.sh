#!/bin/bash

set -e

# Configurar Android SDK corretamente
if [ -z "$ANDROID_SDK_ROOT" ]; then
  export ANDROID_SDK_ROOT="/c/Users/erik.gondim/AppData/Local/Android/Sdk"
  export PATH="$PATH:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools"
  echo "⚠️  ANDROID_SDK_ROOT não definido. Usando padrão: $ANDROID_SDK_ROOT"
fi

echo "🔍 Verificando emuladores Android ativos..."

# Função robusta para listar AVDs filtrando logs
get_avd_list() {
  # Executa em modo silencioso e filtra apenas os nomes de AVD
  "$ANDROID_SDK_ROOT/emulator/emulator" -list-avds 2>/dev/null | grep -v 'INFO' | grep -v 'Storing' | tr -d '\r'
}

# Função para esperar o ADB ficar estável
wait_for_adb() {
    local max_attempts=20
    local attempt=0
    
    echo "   Verificando estabilidade do ADB..."
    until adb shell getprop sys.boot_completed > /dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -gt $max_attempts ]; then
            echo "❌ Falha ao conectar ao ADB após $max_attempts tentativas"
            return 1
        fi
        sleep 5
        if [ $((attempt % 4)) -eq 0 ]; then
            echo "   Reiniciando servidor ADB (tentativa $attempt)..."
            adb kill-server > /dev/null 2>&1
            sleep 2
            adb start-server > /dev/null 2>&1
        fi
    done
    echo "   ✅ ADB estável e responsivo"
    return 0
}

# Verifica dispositivos conectados
if adb devices | grep -q -w "device" && ! adb devices | grep -q "emulator"; then
    echo "⚠️  Dispositivo físico detectado! Certifique-se de que o emulador está selecionado."
    exit 1
fi

if adb devices | grep -q "emulator.*device"; then
    echo "✅ Emulador Android já está rodando."
    wait_for_adb || exit 1
else
    echo "🚀 Iniciando emulador Android..."
    
    # Lista de AVDs com filtragem de logs
    AVD_LIST=$(get_avd_list)
    
    if [ -z "$AVD_LIST" ]; then
        echo "❌ Nenhum AVD encontrado. Por favor:"
        echo "1. Abra o Android Studio"
        echo "2. Crie um emulador em Tools > Device Manager"
        echo "3. Verifique se 'expo-avd' está disponível"
        exit 1
    fi

    # Usa 'expo-avd' se existir, senão o primeiro da lista
    if echo "$AVD_LIST" | grep -q "expo-avd"; then
        TARGET_AVD="expo-avd"
    else
        TARGET_AVD=$(echo "$AVD_LIST" | head -n 1)
    fi

    echo "   Usando AVD: $TARGET_AVD"
    
    # Fecha instâncias existentes
    adb emu kill > /dev/null 2>&1 || true
    sleep 2
    
    # Inicia o emulador diretamente do caminho completo
    echo "   Iniciando emulador..."
    "$ANDROID_SDK_ROOT/emulator/emulator" -avd "$TARGET_AVD" -no-snapshot -no-boot-anim -wipe-data > emulator.log 2>&1 &
    
    echo "⏳ Aguardando inicialização do emulador..."
    
    # Espera o boot completar
    boot_completed=""
    while [ "$boot_completed" != "1" ]; do
        sleep 10
        boot_completed=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || echo "")
        echo "   Estado do boot: ${boot_completed:-não detectado}"
        
        # Timeout após 5 minutos
        if [ $SECONDS -gt 300 ]; then
            echo "❌ Falha no boot do emulador após 5 minutos. Verifique emulator.log"
            exit 1
        fi
    done
    
    wait_for_adb || exit 1
    echo "   ✅ Emulador pronto"
fi

echo "🐳 Construindo e iniciando containers Docker..."
docker compose up --build --detach

echo "🔁 Configurando redirecionamento de portas ADB..."
for port in 8081 19000 19001 19006; do
    adb reverse tcp:$port tcp:$port > /dev/null 2>&1
    echo "   Porta $port redirecionada"
done

echo "📱 Iniciando aplicativo Expo..."
sleep 10
pnpm expo run:android

echo -e "\n✨ Todos os processos foram iniciados! Acesse:"
echo "   - Expo DevTools: http://localhost:19002"
echo "   - Aplicativo: exp://localhost:19000"