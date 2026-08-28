import type { LocaleCode } from "./messages";

export type LaunchCopy = {
  heroEyebrow:string;
  skipContent:string;
  recipientPlaceholder:string;
  someoneSpecial:string;
  liveDirectionPreview:string;
  previewNote:string;
  printSizeLayout:string;
  photoPrivacy:string;
  photoTypes:string;
  removePhoto:string;
  photoTooLarge:string;
  photoInvalid:string;
  photoOptimizing:string;
  paletteSoftened:string;
  magicBalanced:string;
  messageFull:string;
  shortenForMe:string;
  instantDigital:string;
  noPhysical:string;
  filesReady:string;
  noAccount:string;
  keepForever:string;
  printShare:string;
  refundPolicy:string;
  preparingCheckout:string;
  checkoutUnavailable:string;
  buyingThisCard:string;
  printReadyPdf:string;
  qualityGuarantee:string;
  generationStages:[string,string,string,string];
  generationWaiting:string;
  generationFallbackReady:string;
  generationFallbackNotice:string;
  chooseNamed:(name:string)=>string;
  noneFeelRight:string;
  rewriteUnavailable:string;
  customOccasionPlaceholder:string;
  customRelationPlaceholder:string;
  quiet:{name:string;sub:string;badge:string;kicker:string;headline:string;body:string};
};

const c:Record<LocaleCode,LaunchCopy>={
  en:{
    heroEyebrow:"Premium cards, thoughtfully composed",skipContent:"Skip to content",
    recipientPlaceholder:"e.g., Olivia",someoneSpecial:"someone special",
    liveDirectionPreview:"Live direction preview",previewNote:"Final compositions appear after generation.",
    printSizeLayout:"Print size / layout",
    photoPrivacy:"Used only to compose this card.",photoTypes:"JPG, PNG, WebP or AVIF · up to 10 MB",removePhoto:"Remove photo",
    photoTooLarge:"Please use an image up to 10 MB.",photoInvalid:"Please choose a supported image file.",photoOptimizing:"Preparing your photo for a fast, high-quality preview…",paletteSoftened:"We softened the sampled colors to keep the card elegant.",
    magicBalanced:"Keeping the design balanced as you edit",messageFull:"Your message is getting a little full. Shortening it will keep the card beautifully balanced.",shortenForMe:"Shorten for me ✦",
    instantDigital:"Instant digital download",noPhysical:"No physical card is shipped",
    filesReady:"High-resolution JPG + print-ready PDF · no watermark after purchase",
    noAccount:"No subscription · no account required",keepForever:"Keep the downloaded files forever · no expiration",printShare:"Print at home, at a print shop, or share digitally.",
    refundPolicy:"Refund policy",preparingCheckout:"Preparing secure checkout…",checkoutUnavailable:"Checkout is temporarily unavailable. Please try again.",
    buyingThisCard:"You’re buying this card.",printReadyPdf:"Print-ready PDF",qualityGuarantee:"First Purchase Quality Guarantee",
    generationStages:["Choosing the paper and mood…","Setting the typography…","Composing three distinct directions…","Polishing the final details…"],generationWaiting:"Still composing — your card is being finished with care.",generationFallbackReady:"A few finishing touches changed — your three directions are ready.",generationFallbackNotice:"Our live design service took a little too long, so we prepared three curated CardeLume directions from your choices. You can keep going normally.",
    noneFeelRight:'None of these feel quite right?',rewriteUnavailable:'We kept your message unchanged. Try again in a moment.',customOccasionPlaceholder:'e.g., Graduation, Retirement…',customRelationPlaceholder:'e.g., Sister, Teacher…',
    chooseNamed:(name)=>`Choose ${name}`,
    quiet:{name:"Quiet Letter",sub:"Letterpress · intimate typography · tactile restraint",badge:"Letterpress",kicker:"A QUIET NOTE",headline:"A few words, held close.",body:"Some things are best said simply, and kept for a long time."}
  },
  ja:{
    heroEyebrow:"想いを丁寧に仕立てる、上質なカード",skipContent:"本文へ移動",
    recipientPlaceholder:"例：Olivia",someoneSpecial:"大切な人",
    liveDirectionPreview:"ライブスタイルプレビュー",previewNote:"最終的な3案は生成後に表示されます。",
    printSizeLayout:"印刷サイズ / レイアウト",
    photoPrivacy:"このカードを仕上げるためだけに使用します。",photoTypes:"JPG / PNG / WebP / AVIF · 10MBまで",removePhoto:"写真を削除",
    photoTooLarge:"10MB以下の画像を選んでください。",photoInvalid:"対応している画像ファイルを選んでください。",photoOptimizing:"高品質なプレビュー用に写真を整えています…",paletteSoftened:"上品な仕上がりを保つため、写真の色を少しやわらげました。",
    magicBalanced:"編集しても美しいバランスを保ちます",messageFull:"少し文字量が多くなっています。短くすると、より美しい余白を保てます。",shortenForMe:"きれいに短くする ✦",
    instantDigital:"購入後すぐにダウンロード",noPhysical:"実物のカードは発送されません",
    filesReady:"高解像度JPG + 印刷用PDF · 購入後は透かしなし",
    noAccount:"サブスク不要 · アカウント不要",keepForever:"ダウンロードしたファイルは期限なく保存できます",printShare:"自宅や印刷店で印刷、またはデジタルでシェアできます。",
    refundPolicy:"返金ポリシー",preparingCheckout:"安全な決済を準備しています…",checkoutUnavailable:"現在決済をご利用いただけません。もう一度お試しください。",
    buyingThisCard:"この一枚を購入します。",printReadyPdf:"印刷用PDF",qualityGuarantee:"初回購入 品質保証",
    generationStages:["紙の質感と雰囲気を選んでいます…","文字組みを整えています…","異なる3つのデザインを仕立てています…","最後の細部を整えています…"],generationWaiting:"もう少しだけ。丁寧に仕上げています。",generationFallbackReady:"仕上げ方を少し切り替えて、3つの方向をご用意しました。",generationFallbackNotice:"ライブのデザイン処理に少し時間がかかったため、入力内容からCardeLume厳選の3案をご用意しました。このまま通常どおりお選びいただけます。",
    noneFeelRight:'どれもしっくりきませんか？',rewriteUnavailable:'文面は変更していません。少し時間をおいてもう一度お試しください。',customOccasionPlaceholder:'例：卒業、退職…',customRelationPlaceholder:'例：姉、先生…',
    chooseNamed:(name)=>`${name}を選ぶ`,
    quiet:{name:"静かな手紙",sub:"活版 · 親密なタイポグラフィ · 控えめな質感",badge:"活版",kicker:"小さな手紙",headline:"少しの言葉を、そっと残して。",body:"シンプルな言葉ほど、長く心に残ることがあります。"}
  },
  ko:{
    heroEyebrow:"마음을 세심하게 담은 프리미엄 카드",skipContent:"본문으로 이동",
    recipientPlaceholder:"예: Olivia",someoneSpecial:"소중한 사람",
    liveDirectionPreview:"실시간 스타일 미리보기",previewNote:"최종 3가지 디자인은 생성 후 보여드려요.",
    printSizeLayout:"인쇄 크기 / 레이아웃",
    photoPrivacy:"이 카드를 구성하는 데에만 사용합니다.",photoTypes:"JPG, PNG, WebP, AVIF · 최대 10MB",removePhoto:"사진 삭제",
    photoTooLarge:"10MB 이하의 이미지를 사용해 주세요.",photoInvalid:"지원되는 이미지 파일을 선택해 주세요.",photoOptimizing:"빠르고 선명한 미리보기를 위해 사진을 준비하는 중…",paletteSoftened:"카드의 우아함을 유지하도록 사진 색을 조금 부드럽게 조정했어요.",
    magicBalanced:"편집해도 디자인 균형을 유지합니다",messageFull:"문장이 조금 길어졌어요. 조금 줄이면 카드의 여백과 균형이 더 아름답게 유지됩니다.",shortenForMe:"아름답게 줄이기 ✦",
    instantDigital:"즉시 디지털 다운로드",noPhysical:"실물 카드는 배송되지 않습니다",
    filesReady:"고해상도 JPG + 인쇄용 PDF · 구매 후 워터마크 없음",
    noAccount:"구독 없음 · 계정 필요 없음",keepForever:"다운로드한 파일은 만료 없이 계속 보관할 수 있어요",printShare:"집이나 인쇄소에서 인쇄하거나 디지털로 공유하세요.",
    refundPolicy:"환불 정책",preparingCheckout:"안전한 결제를 준비하는 중…",checkoutUnavailable:"현재 결제를 사용할 수 없습니다. 다시 시도해 주세요.",
    buyingThisCard:"지금 보고 있는 이 카드를 구매합니다.",printReadyPdf:"인쇄용 PDF",qualityGuarantee:"첫 구매 품질 보장",
    generationStages:["종이 질감과 분위기를 고르는 중…","글자 배치를 다듬는 중…","서로 다른 세 가지 방향을 구성하는 중…","마지막 디테일을 정리하는 중…"],generationWaiting:"조금만 더 기다려 주세요. 정성스럽게 마무리하고 있어요.",generationFallbackReady:"마무리 방식을 살짝 바꿔 세 가지 방향을 준비했어요.",generationFallbackNotice:"실시간 디자인 처리가 예상보다 길어져 입력하신 내용을 바탕으로 CardeLume가 엄선한 세 가지 방향을 준비했어요. 그대로 선택해 진행하시면 됩니다.",
    noneFeelRight:'아직 딱 맞는 느낌이 없나요?',rewriteUnavailable:'메시지는 그대로 두었어요. 잠시 후 다시 시도해 주세요.',customOccasionPlaceholder:'예: 졸업, 은퇴…',customRelationPlaceholder:'예: 자매, 선생님…',
    chooseNamed:(name)=>`${name} 선택`,
    quiet:{name:"고요한 편지",sub:"레터프레스 · 친밀한 글자 배치 · 절제된 종이 질감",badge:"레터프레스",kicker:"조용한 한마디",headline:"오래 간직하고 싶은 몇 마디.",body:"가장 오래 남는 말은 때로 가장 단순한 말입니다."}
  },
  es:{
    heroEyebrow:"Tarjetas premium, compuestas con intención",skipContent:"Ir al contenido",
    recipientPlaceholder:"p. ej., Olivia",someoneSpecial:"alguien especial",
    liveDirectionPreview:"Vista previa del estilo",previewNote:"Los tres diseños finales aparecen después de generarlos.",
    printSizeLayout:"Tamaño de impresión / formato",
    photoPrivacy:"Se usa solo para crear esta tarjeta.",photoTypes:"JPG, PNG, WebP o AVIF · hasta 10 MB",removePhoto:"Quitar foto",
    photoTooLarge:"Usa una imagen de hasta 10 MB.",photoInvalid:"Elige un archivo de imagen compatible.",photoOptimizing:"Preparando tu foto para una vista previa rápida y nítida…",paletteSoftened:"Suavizamos los colores de la foto para mantener la tarjeta elegante.",
    magicBalanced:"Manteniendo el diseño equilibrado mientras editas",messageFull:"El mensaje está quedando un poco lleno. Acortarlo ayudará a conservar una composición más elegante.",shortenForMe:"Acortarlo por mí ✦",
    instantDigital:"Descarga digital instantánea",noPhysical:"No se envía una tarjeta física",
    filesReady:"JPG de alta resolución + PDF para imprimir · sin marca de agua tras la compra",
    noAccount:"Sin suscripción · sin cuenta obligatoria",keepForever:"Conserva para siempre los archivos descargados · sin caducidad",printShare:"Imprime en casa, en una imprenta o compártela digitalmente.",
    refundPolicy:"Política de reembolso",preparingCheckout:"Preparando el pago seguro…",checkoutUnavailable:"El pago no está disponible temporalmente. Inténtalo de nuevo.",
    buyingThisCard:"Estás comprando esta tarjeta.",printReadyPdf:"PDF listo para imprimir",qualityGuarantee:"Garantía de calidad en tu primera compra",
    generationStages:["Eligiendo el papel y la atmósfera…","Cuidando la tipografía…","Componiendo tres direcciones distintas…","Afinando los últimos detalles…"],generationWaiting:"Seguimos componiéndola con cuidado. Ya falta poco.",generationFallbackReady:"Hemos ajustado el acabado y tus tres direcciones ya están listas.",generationFallbackNotice:"El servicio de diseño en vivo tardó un poco más de lo previsto, así que preparamos tres direcciones CardeLume cuidadosamente seleccionadas a partir de tus elecciones. Puedes continuar con normalidad.",
    noneFeelRight:'¿Ninguna termina de encajar?',rewriteUnavailable:'Conservamos tu mensaje sin cambios. Inténtalo de nuevo en un momento.',customOccasionPlaceholder:'p. ej., Graduación, Jubilación…',customRelationPlaceholder:'p. ej., Hermana, Profesora…',
    chooseNamed:(name)=>`Elegir ${name}`,
    quiet:{name:"Carta serena",sub:"Letterpress · tipografía íntima · tacto contenido",badge:"Letterpress",kicker:"UNA NOTA TRANQUILA",headline:"Pocas palabras, muy cerca.",body:"Hay cosas que se dicen mejor con sencillez y se guardan durante mucho tiempo."}
  },
  fr:{
    heroEyebrow:"Des cartes haut de gamme, composées avec soin",skipContent:"Aller au contenu",
    recipientPlaceholder:"ex. Olivia",someoneSpecial:"quelqu’un de spécial",
    liveDirectionPreview:"Aperçu du style",previewNote:"Les trois créations finales apparaissent une fois créées.",
    printSizeLayout:"Format d’impression / mise en page",
    photoPrivacy:"Utilisée uniquement pour composer cette carte.",photoTypes:"JPG, PNG, WebP ou AVIF · 10 Mo max.",removePhoto:"Supprimer la photo",
    photoTooLarge:"Choisissez une image de 10 Mo maximum.",photoInvalid:"Choisissez un fichier image pris en charge.",photoOptimizing:"Préparation de votre photo pour un aperçu rapide et soigné…",paletteSoftened:"Nous avons adouci les couleurs de la photo pour préserver l’élégance de la carte.",
    magicBalanced:"La composition reste équilibrée pendant vos modifications",messageFull:"Le message devient un peu dense. Le raccourcir aidera la carte à garder une composition plus élégante.",shortenForMe:"Le raccourcir pour moi ✦",
    instantDigital:"Téléchargement numérique instantané",noPhysical:"Aucune carte physique n’est expédiée",
    filesReady:"JPG haute résolution + PDF prêt à imprimer · sans filigrane après achat",
    noAccount:"Sans abonnement · aucun compte requis",keepForever:"Conservez les fichiers téléchargés sans limite de durée",printShare:"Imprimez chez vous, chez un imprimeur ou partagez-la en ligne.",
    refundPolicy:"Politique de remboursement",preparingCheckout:"Préparation du paiement sécurisé…",checkoutUnavailable:"Le paiement est temporairement indisponible. Réessayez.",
    buyingThisCard:"Vous achetez cette carte.",printReadyPdf:"PDF prêt à imprimer",qualityGuarantee:"Garantie qualité pour votre premier achat",
    generationStages:["Choix du papier et de l’atmosphère…","Mise en place de la typographie…","Composition de trois directions distinctes…","Finition des derniers détails…"],generationWaiting:"La composition se poursuit avec soin. Encore un instant.",generationFallbackReady:"Nous avons ajusté la finition : vos trois directions sont prêtes.",generationFallbackNotice:"Le service de composition en direct a pris un peu plus de temps que prévu. Nous avons donc préparé trois directions CardeLume soigneusement sélectionnées à partir de vos choix. Vous pouvez continuer normalement.",
    noneFeelRight:'Aucune ne semble tout à fait juste ?',rewriteUnavailable:'Votre message est resté inchangé. Réessayez dans un instant.',customOccasionPlaceholder:'ex. Diplôme, Retraite…',customRelationPlaceholder:'ex. Sœur, Professeur…',
    chooseNamed:(name)=>`Choisir ${name}`,
    quiet:{name:"Lettre discrète",sub:"Letterpress · typographie intime · matière retenue",badge:"Letterpress",kicker:"UN MOT TOUT DOUX",headline:"Quelques mots à garder près de soi.",body:"Certaines choses se disent mieux simplement, et restent longtemps."}
  },
  de:{
    heroEyebrow:"Premium-Karten, mit Sorgfalt komponiert",skipContent:"Zum Inhalt springen",
    recipientPlaceholder:"z. B. Olivia",someoneSpecial:"einen besonderen Menschen",
    liveDirectionPreview:"Live-Stilvorschau",previewNote:"Die drei finalen Kompositionen erscheinen nach der Generierung.",
    printSizeLayout:"Druckgröße / Layout",
    photoPrivacy:"Wird nur zur Gestaltung dieser Karte verwendet.",photoTypes:"JPG, PNG, WebP oder AVIF · bis 10 MB",removePhoto:"Foto entfernen",
    photoTooLarge:"Bitte verwenden Sie ein Bild bis 10 MB.",photoInvalid:"Bitte wählen Sie eine unterstützte Bilddatei.",photoOptimizing:"Foto wird für eine schnelle, hochwertige Vorschau vorbereitet…",paletteSoftened:"Wir haben die Bildfarben leicht beruhigt, damit die Karte elegant bleibt.",
    magicBalanced:"Die Komposition bleibt beim Bearbeiten im Gleichgewicht",messageFull:"Der Text wird etwas dicht. Kürzer bleibt die Karte luftiger und eleganter.",shortenForMe:"Für mich kürzen ✦",
    instantDigital:"Sofortiger digitaler Download",noPhysical:"Es wird keine physische Karte versendet",
    filesReady:"Hochauflösendes JPG + druckfertiges PDF · nach Kauf ohne Wasserzeichen",
    noAccount:"Kein Abo · kein Konto erforderlich",keepForever:"Heruntergeladene Dateien dauerhaft behalten · kein Ablaufdatum",printShare:"Zu Hause oder in einer Druckerei drucken oder digital teilen.",
    refundPolicy:"Rückerstattungsrichtlinie",preparingCheckout:"Sicherer Checkout wird vorbereitet…",checkoutUnavailable:"Checkout ist vorübergehend nicht verfügbar. Bitte erneut versuchen.",
    buyingThisCard:"Sie kaufen genau diese Karte.",printReadyPdf:"Druckfertiges PDF",qualityGuarantee:"Qualitätsgarantie für den ersten Kauf",
    generationStages:["Papier und Stimmung werden gewählt…","Typografie wird gesetzt…","Drei unterschiedliche Richtungen werden komponiert…","Letzte Details werden verfeinert…"],generationWaiting:"Die Karte wird noch sorgfältig fertiggestellt. Einen Moment bitte.",generationFallbackReady:"Wir haben die Ausarbeitung angepasst — Ihre drei Richtungen sind bereit.",generationFallbackNotice:"Der Live-Designservice hat etwas länger gebraucht. Deshalb haben wir aus Ihren Angaben drei kuratierte CardeLume-Richtungen vorbereitet. Sie können ganz normal fortfahren.",
    noneFeelRight:'Noch nicht ganz das Richtige dabei?',rewriteUnavailable:'Ihre Nachricht blieb unverändert. Versuchen Sie es gleich noch einmal.',customOccasionPlaceholder:'z. B. Abschluss, Ruhestand…',customRelationPlaceholder:'z. B. Schwester, Lehrerin…',
    chooseNamed:(name)=>`${name} wählen`,
    quiet:{name:"Stiller Brief",sub:"Letterpress · intime Typografie · zurückhaltende Materialität",badge:"Letterpress",kicker:"EINE LEISE NOTIZ",headline:"Ein paar Worte, die bleiben.",body:"Manches sagt man am schönsten ganz einfach — und bewahrt es lange auf."}
  },
  pt:{
    heroEyebrow:"Cartões premium, compostos com cuidado",skipContent:"Ir para o conteúdo",
    recipientPlaceholder:"ex.: Olivia",someoneSpecial:"alguém especial",
    liveDirectionPreview:"Prévia do estilo",previewNote:"As três composições finais aparecem assim que estiverem prontas.",
    printSizeLayout:"Tamanho de impressão / formato",
    photoPrivacy:"Usada somente para compor este cartão.",photoTypes:"JPG, PNG, WebP ou AVIF · até 10 MB",removePhoto:"Remover foto",
    photoTooLarge:"Use uma imagem de até 10 MB.",photoInvalid:"Escolha um arquivo de imagem compatível.",photoOptimizing:"Preparando sua foto para uma prévia rápida e nítida…",paletteSoftened:"Suavizamos as cores da foto para manter o cartão elegante.",
    magicBalanced:"Mantendo a composição equilibrada enquanto você edita",messageFull:"A mensagem está ficando um pouco cheia. Encurtar ajuda a manter a composição mais elegante.",shortenForMe:"Encurtar para mim ✦",
    instantDigital:"Download digital instantâneo",noPhysical:"Nenhum cartão físico é enviado",
    filesReady:"JPG em alta resolução + PDF pronto para imprimir · sem marca d’água após a compra",
    noAccount:"Sem assinatura · sem conta obrigatória",keepForever:"Guarde os arquivos baixados para sempre · sem validade",printShare:"Imprima em casa, em uma gráfica ou compartilhe digitalmente.",
    refundPolicy:"Política de reembolso",preparingCheckout:"Preparando checkout seguro…",checkoutUnavailable:"O checkout está temporariamente indisponível. Tente novamente.",
    buyingThisCard:"Você está comprando este cartão.",printReadyPdf:"PDF pronto para imprimir",qualityGuarantee:"Garantia de qualidade na primeira compra",
    generationStages:["Escolhendo o papel e a atmosfera…","Ajustando a tipografia…","Compondo três direções distintas…","Refinando os últimos detalhes…"],generationWaiting:"Ainda estamos finalizando com cuidado. Só mais um instante.",generationFallbackReady:"Ajustamos o acabamento e suas três direções já estão prontas.",generationFallbackNotice:"O serviço de design ao vivo demorou um pouco mais que o esperado, então preparamos três direções CardeLume cuidadosamente selecionadas a partir das suas escolhas. Você pode continuar normalmente.",
    noneFeelRight:'Nenhuma parece exatamente certa?',rewriteUnavailable:'Sua mensagem foi mantida sem alterações. Tente novamente em instantes.',customOccasionPlaceholder:'ex.: Formatura, Aposentadoria…',customRelationPlaceholder:'ex.: Irmã, Professora…',
    chooseNamed:(name)=>`Escolher ${name}`,
    quiet:{name:"Carta serena",sub:"Letterpress · tipografia íntima · textura contida",badge:"Letterpress",kicker:"UMA NOTA TRANQUILA",headline:"Poucas palavras para guardar por perto.",body:"Algumas coisas ficam melhores quando ditas com simplicidade e guardadas por muito tempo."}
  },
  it:{
    heroEyebrow:"Biglietti premium, composti con cura",skipContent:"Vai al contenuto",
    recipientPlaceholder:"es. Olivia",someoneSpecial:"una persona speciale",
    liveDirectionPreview:"Anteprima dello stile",previewNote:"Le tre composizioni finali appaiono appena sono pronte.",
    printSizeLayout:"Formato di stampa / impaginazione",
    photoPrivacy:"Usata solo per comporre questo biglietto.",photoTypes:"JPG, PNG, WebP o AVIF · fino a 10 MB",removePhoto:"Rimuovi foto",
    photoTooLarge:"Usa un’immagine fino a 10 MB.",photoInvalid:"Scegli un file immagine supportato.",photoOptimizing:"Prepariamo la foto per un’anteprima rapida e nitida…",paletteSoftened:"Abbiamo attenuato i colori della foto per mantenere il biglietto elegante.",
    magicBalanced:"Manteniamo la composizione equilibrata mentre modifichi",messageFull:"Il messaggio sta diventando un po’ pieno. Accorciarlo aiuterà a mantenere la composizione più elegante.",shortenForMe:"Accorcialo per me ✦",
    instantDigital:"Download digitale immediato",noPhysical:"Non viene spedito alcun biglietto fisico",
    filesReady:"JPG ad alta risoluzione + PDF pronto per la stampa · senza watermark dopo l’acquisto",
    noAccount:"Nessun abbonamento · nessuna registrazione richiesta",keepForever:"Conserva per sempre i file scaricati · nessuna scadenza",printShare:"Stampa a casa, in tipografia o condividi in digitale.",
    refundPolicy:"Politica di rimborso",preparingCheckout:"Preparazione del pagamento sicuro…",checkoutUnavailable:"Il pagamento è temporaneamente non disponibile. Riprova.",
    buyingThisCard:"Stai acquistando questo biglietto.",printReadyPdf:"PDF pronto per la stampa",qualityGuarantee:"Garanzia qualità sul primo acquisto",
    generationStages:["Scegliendo carta e atmosfera…","Curando la tipografia…","Componendo tre direzioni distinte…","Rifinendo gli ultimi dettagli…"],generationWaiting:"Stiamo ancora rifinendo il biglietto con cura. Ancora un momento.",generationFallbackReady:"Abbiamo adattato la finitura: le tue tre direzioni sono pronte.",generationFallbackNotice:"Il servizio di design in tempo reale ha impiegato un po’ più del previsto, quindi abbiamo preparato tre direzioni CardeLume curate a partire dalle tue scelte. Puoi continuare normalmente.",
    noneFeelRight:'Nessuna sembra ancora quella giusta?',rewriteUnavailable:'Il messaggio è rimasto invariato. Riprova tra poco.',customOccasionPlaceholder:'es. Laurea, Pensionamento…',customRelationPlaceholder:'es. Sorella, Insegnante…',
    chooseNamed:(name)=>`Scegli ${name}`,
    quiet:{name:"Lettera discreta",sub:"Letterpress · tipografia intima · materia discreta",badge:"Letterpress",kicker:"UNA NOTA QUIETA",headline:"Poche parole da tenere vicine.",body:"Alcune cose si dicono meglio con semplicità e restano a lungo."}
  },
  zh:{
    heroEyebrow:"用心排版的高级贺卡",skipContent:"跳到正文",
    recipientPlaceholder:"例如：Olivia",someoneSpecial:"特别的人",
    liveDirectionPreview:"实时风格预览",previewNote:"最终的三款设计会在生成后呈现。",
    printSizeLayout:"打印尺寸 / 版式",
    photoPrivacy:"仅用于完成这张卡片。",photoTypes:"JPG / PNG / WebP / AVIF · 不超过10MB",removePhoto:"移除照片",
    photoTooLarge:"请选择10MB以内的图片。",photoInvalid:"请选择支持的图片文件。",photoOptimizing:"正在为快速且清晰的预览优化照片…",paletteSoftened:"我们稍微柔化了照片颜色，以保持卡片的高级感。",
    magicBalanced:"编辑时自动保持版式平衡",messageFull:"文字稍微有些多。适当缩短后，卡片会保留更漂亮的留白与平衡。",shortenForMe:"帮我精简 ✦",
    instantDigital:"即时数字下载",noPhysical:"不会寄送实体卡片",
    filesReady:"高清JPG + 可打印PDF · 购买后无水印",
    noAccount:"无需订阅 · 无需账号",keepForever:"下载后的文件可永久保存 · 无有效期限制",printShare:"可在家打印、交给打印店，或直接数字分享。",
    refundPolicy:"退款政策",preparingCheckout:"正在准备安全结账…",checkoutUnavailable:"结账暂时不可用，请稍后重试。",
    buyingThisCard:"你购买的就是这张卡片。",printReadyPdf:"可直接打印的 PDF",qualityGuarantee:"首次购买质量保障",
    generationStages:["正在挑选纸张质感与氛围…","正在细调字体与排版…","正在构成三种不同的视觉方向…","正在完成最后的细节…"],generationWaiting:"还在用心完成最后的处理，请稍候片刻。",generationFallbackReady:"我们稍微调整了完成方式，三种设计方向已经准备好了。",generationFallbackNotice:"实时设计服务花费的时间比预期稍长，因此我们根据你的选择准备了三种经过精选的 CardeLume 设计方向。你可以照常继续。",
    noneFeelRight:'这三款还没有真正打动你？',rewriteUnavailable:'我们保留了原文。请稍后再试一次。',customOccasionPlaceholder:'例如：毕业、退休…',customRelationPlaceholder:'例如：姐姐、老师…',
    chooseNamed:(name)=>`选择${name}`,
    quiet:{name:"静谧书信",sub:"凸版 · 亲密排版 · 克制纸感",badge:"凸版",kicker:"一封轻声的信",headline:"几句话，留在身边。",body:"有些话越简单，越值得被长久保存。"}
  },
  vi:{
    heroEyebrow:"Thiệp cao cấp, được chăm chút từng chi tiết",skipContent:"Đi tới nội dung",
    recipientPlaceholder:"ví dụ: Olivia",someoneSpecial:"một người đặc biệt",
    liveDirectionPreview:"Xem trước hướng thiết kế",previewNote:"Ba bố cục hoàn chỉnh sẽ xuất hiện sau khi tạo.",
    printSizeLayout:"Kích thước in / bố cục",
    photoPrivacy:"Chỉ dùng để tạo tấm thiệp này.",photoTypes:"JPG, PNG, WebP hoặc AVIF · tối đa 10 MB",removePhoto:"Xóa ảnh",
    photoTooLarge:"Vui lòng dùng ảnh tối đa 10 MB.",photoInvalid:"Vui lòng chọn định dạng ảnh được hỗ trợ.",photoOptimizing:"Đang tối ưu ảnh để xem trước nhanh và sắc nét…",paletteSoftened:"Chúng tôi làm dịu màu lấy từ ảnh để tấm thiệp vẫn thanh lịch.",
    magicBalanced:"Giữ bố cục cân bằng khi bạn chỉnh lời",messageFull:"Lời nhắn đang hơi đầy. Rút gọn một chút sẽ giúp tấm thiệp giữ được bố cục đẹp nhất.",shortenForMe:"Rút gọn giúp tôi ✦",
    instantDigital:"Tải file số ngay sau khi mua",noPhysical:"Không có thiệp vật lý được giao",
    filesReady:"JPG độ phân giải cao + PDF sẵn sàng in · không watermark sau khi mua",
    noAccount:"Không đăng ký gói · không cần tài khoản",keepForever:"File đã tải về được giữ vĩnh viễn · không hết hạn",printShare:"In tại nhà, tiệm in hoặc chia sẻ trực tiếp online.",
    refundPolicy:"Chính sách hoàn tiền",preparingCheckout:"Đang chuẩn bị thanh toán an toàn…",checkoutUnavailable:"Thanh toán tạm thời chưa khả dụng. Vui lòng thử lại.",
    buyingThisCard:"Bạn đang mua đúng tấm thiệp này.",printReadyPdf:"PDF sẵn sàng để in",qualityGuarantee:"Đảm bảo chất lượng cho lần mua đầu tiên",
    generationStages:["Đang chọn chất giấy và sắc thái…","Đang tinh chỉnh kiểu chữ…","Đang tạo ba hướng thiết kế thật khác nhau…","Đang hoàn thiện những chi tiết cuối…"],generationWaiting:"Tấm thiệp vẫn đang được hoàn thiện cẩn thận. Chờ thêm một chút nhé.",generationFallbackReady:"Chúng tôi đã đổi cách hoàn thiện một chút — ba hướng thiết kế đã sẵn sàng.",generationFallbackNotice:"Dịch vụ thiết kế trực tiếp phản hồi lâu hơn dự kiến, nên CardeLume đã chuẩn bị ba hướng thiết kế được tuyển chọn từ chính lựa chọn của bạn. Bạn có thể tiếp tục bình thường.",
    noneFeelRight:'Chưa tấm nào thật sự đúng ý?',rewriteUnavailable:'Lời chúc của bạn vẫn được giữ nguyên. Hãy thử lại sau một chút.',customOccasionPlaceholder:'ví dụ: Tốt nghiệp, Nghỉ hưu…',customRelationPlaceholder:'ví dụ: Chị gái, Giáo viên…',
    chooseNamed:(name)=>`Chọn ${name}`,
    quiet:{name:"Lá thư tĩnh lặng",sub:"Letterpress · kiểu chữ thân mật · chất liệu tiết chế",badge:"Letterpress",kicker:"MỘT LỜI NHẮN NHẸ",headline:"Vài lời để giữ thật gần.",body:"Có những điều càng nói giản dị, càng ở lại lâu trong lòng."}
  }
};

export function launchCopy(locale:LocaleCode){ return c[locale]; }
