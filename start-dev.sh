#!/bin/bash

# Limpa o console antes de iniciar
clear

set -e

# Configuração dinâmica do Android SDK
if [ -z "$ANDROID_SDK_ROOT" ]; then
  # Busca em locais comuns para diferentes sistemas operacionais
  possible_paths=(
    "$HOME/Android/Sdk"
    "$HOME/Library/Android/sdk"
    "$LOCALAPPDATA/Android/Sdk"
    "/opt/android-sdk"
    "/usr/local/android-sdk"
  )
  
  for path in "${possible_paths[@]}"; do
    if [ -d "$path" ]; then
      export ANDROID_SDK_ROOT="$path"
      break
    fi
  done

  if [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "❌ ANDROID_SDK_ROOT não definido e não encontrado nos locais padrão"
    echo "Locais verificados:"
    printf "  • %s\n" "${possible_paths[@]}"
    echo "Por favor configure manualmente a variável ANDROID_SDK_ROOT"
    exit 1
  fi
  
  export PATH="$PATH:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools"
  echo "ℹ️  Android SDK detectado em: $ANDROID_SDK_ROOT"
fi

# Menu de seleção de execução
echo "Selecione o modo de execução:"
echo "1) Usar Expo Go (dispositivo físico - QR Code)"
echo "2) Usar Emulador Android (instalação automática)"
read -p "Opção [1/2]: " choice

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

# Função robusta para listar AVDs
get_avd_list() {
  "$ANDROID_SDK_ROOT/emulator/emulator" -list-avds 2>/dev/null | grep -v 'INFO' | grep -v 'Storing' | tr -d '\r'
}

# Modo Expo Go (Dispositivo Físico - QR Code)
if [ "$choice" == "1" ]; then
  clear
  echo "📱 Modo selecionado: Expo Go (Dispositivo Físico)"
  echo "🔍 Você precisará escanear o QR Code que aparecerá no terminal"
  
  echo "🐳 Construindo containers Docker..."
  docker compose up --build --detach

  echo -e "\n🚀 Iniciando servidor Expo..."
  echo "============================================================"
  echo "📱 Por favor, ESCANEIE O QR CODE abaixo com o app Expo Go"
  echo "   no seu dispositivo físico para iniciar o aplicativo"
  echo ""
  echo "   Certifique-se que seu dispositivo está na mesma rede!"
  echo "============================================================"
  echo ""
  
  # Inicia o Expo mostrando o QR Code
  pnpm expo start --dev-client

# Modo Emulador Android
elif [ "$choice" == "2" ]; then
  clear
  echo "🤖 Modo selecionado: Emulador Android"

  # Verificar emuladores ativos
  if adb devices | grep -q "emulator.*device"; then
      echo "✅ Emulador Android já está rodando."
      wait_for_adb || exit 1
  else
      echo "🚀 Iniciando emulador Android..."
      
      AVD_LIST=$(get_avd_list)
      
      if [ -z "$AVD_LIST" ]; then
          echo "❌ Nenhum AVD encontrado. Por favor:"
          echo "1. Abra o Android Studio"
          echo "2. Crie um emulador em Tools > Device Manager"
          exit 1
      fi

      # Seleção de AVD
      echo "AVDs disponíveis:"
      echo "$AVD_LIST" | cat -n
      read -p "Selecione o número do AVD [1]: " avd_choice
      
      if [ -z "$avd_choice" ]; then
          avd_choice=1
      fi
      
      TARGET_AVD=$(echo "$AVD_LIST" | sed -n "${avd_choice}p")
      
      if [ -z "$TARGET_AVD" ]; then
          echo "❌ Seleção inválida"
          exit 1
      fi

      echo "   Usando AVD: $TARGET_AVD"
      
      # Fecha instâncias existentes
      adb emu kill > /dev/null 2>&1 || true
      sleep 2
      
      # Inicia o emulador
      "$ANDROID_SDK_ROOT/emulator/emulator" -avd "$TARGET_AVD" -no-snapshot -no-boot-anim > emulator.log 2>&1 &
      
      echo "⏳ Aguardando inicialização do emulador..."
      
      # Espera o boot completar
      boot_completed=""
      while [ "$boot_completed" != "1" ]; do
          sleep 10
          boot_completed=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || echo "")
          echo "   Estado do boot: ${boot_completed:-Aguardando}"
          
          # Timeout após 5 minutos
          if [ $SECONDS -gt 300 ]; then
              echo "❌ Falha no boot do emulador após 5 minutos. Verifique emulator.log"
              exit 1
          fi
      done
      
      wait_for_adb || exit 1
      echo "   ✅ Emulador pronto"
  fi

  # Configurar redirecionamento de portas
  echo "🔁 Configurando redirecionamento de portas ADB..."
  for port in 8081 19000 19001 19006; do
      adb reverse tcp:$port tcp:$port > /dev/null 2>&1
      echo "   Porta $port redirecionada"
  done

  echo "🐳 Construindo containers Docker..."
  docker compose up --build --detach

  echo "📱 Instalando e iniciando aplicativo no emulador..."
  # sleep 10
  pnpm expo run:android

else
  echo "❌ Opção inválida!"
  exit 1
fi

echo -e "\n✨ Processo concluído com sucesso!"