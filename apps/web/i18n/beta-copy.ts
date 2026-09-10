import type { LocaleCode } from "./messages";

export type BetaCopy={
  eyebrow:string;
  title:string;
  description:string;
  finishNotice:string;
  finishNote:string;
  jpg:string;
  pdf:string;
  unavailable:string;
  trust:string[];
};

const copy:Record<LocaleCode,Omit<BetaCopy,"trust">>={
  en:{eyebrow:"CardeLume beta",title:"Your card is ready to download",description:"Payment is off during our beta. Download your JPG and print-ready PDF at no charge.",finishNotice:"Payment is disabled during public beta — export and downloads are free.",finishNote:"Payment is disabled during public beta — export and downloads are free.",jpg:"Download JPG",pdf:"Download PDF",unavailable:"Beta files are temporarily unavailable. Please try again."},
  ja:{eyebrow:"CardeLume ベータ",title:"カードをダウンロードできます",description:"ベータ期間中は決済を停止しています。JPGと印刷用PDFを無料でダウンロードできます。",finishNotice:"ベータ期間中は決済を停止しています。高解像度エクスポートは無料です。",finishNote:"ベータ期間中は決済を停止しています。高解像度エクスポートは無料です。",jpg:"JPGをダウンロード",pdf:"PDFをダウンロード",unavailable:"ベータファイルを一時的に利用できません。もう一度お試しください。"},
  ko:{eyebrow:"CardeLume 베타",title:"카드를 다운로드할 수 있어요",description:"베타 기간에는 결제가 꺼져 있어요. JPG와 인쇄용 PDF를 무료로 다운로드하세요.",finishNotice:"공개 베타 기간에는 결제가 비활성화되어 있어요. 무료로 카드를 내보내고 다운로드할 수 있습니다。",finishNote:"공개 베타 기간에는 결제가 비활성화되어 있어요. 무료로 카드를 내보내고 다운로드할 수 있습니다。",jpg:"JPG 다운로드",pdf:"PDF 다운로드",unavailable:"베타 파일을 잠시 사용할 수 없어요. 다시 시도해 주세요."},
  es:{eyebrow:"Beta de CardeLume",title:"Tu tarjeta está lista para descargar",description:"El pago está desactivado durante la beta. Descarga gratis tu JPG y PDF listo para imprimir.",finishNotice:"El pago está desactivado durante la beta pública: la exportación y descarga son gratuitas.",finishNote:"El pago está desactivado durante la beta pública: la exportación y descarga son gratuitas.",jpg:"Descargar JPG",pdf:"Descargar PDF",unavailable:"Los archivos beta no están disponibles temporalmente. Inténtalo de nuevo."},
  fr:{eyebrow:"Bêta CardeLume",title:"Votre carte est prête à télécharger",description:"Le paiement est désactivé pendant la bêta. Téléchargez gratuitement le JPG et le PDF prêt à imprimer.",finishNotice:"Le paiement est désactivé pendant la bêta publique : l'exportation et les téléchargements sont gratuits.",finishNote:"Le paiement est désactivé pendant la bêta publique : l'exportation et les téléchargements sont gratuits.",jpg:"Télécharger le JPG",pdf:"Télécharger le PDF",unavailable:"Les fichiers bêta sont temporairement indisponibles. Réessayez."},
  de:{eyebrow:"CardeLume-Beta",title:"Ihre Karte ist zum Download bereit",description:"Während der Beta ist die Zahlung deaktiviert. Laden Sie JPG und druckfertige PDF kostenlos herunter.",finishNotice:"Während der öffentlichen Beta ist die Zahlung deaktiviert — Export und Download sind kostenlos.",finishNote:"Während der öffentlichen Beta ist die Zahlung deaktiviert — Export und Download sind kostenlos.",jpg:"JPG herunterladen",pdf:"PDF herunterladen",unavailable:"Die Beta-Dateien sind vorübergehend nicht verfügbar. Bitte erneut versuchen."},
  pt:{eyebrow:"Beta CardeLume",title:"Seu cartão está pronto para baixar",description:"O pagamento está desativado durante a beta. Baixe seu JPG e PDF pronto para imprimir gratuitamente.",finishNotice:"O pagamento está desativado durante a beta pública — a exportação e os downloads são gratuitos.",finishNote:"O pagamento está desativado durante a beta pública — a exportação e os downloads são gratuitos.",jpg:"Baixar JPG",pdf:"Baixar PDF",unavailable:"Os arquivos beta estão temporariamente indisponíveis. Tente novamente."},
  it:{eyebrow:"Beta CardeLume",title:"Il tuo biglietto è pronto da scaricare",description:"Il pagamento è disattivato durante la beta. Scarica gratuitamente JPG e PDF pronti per la stampa.",finishNotice:"Il pagamento è disattivato durante la beta pubblica: esportazione e download sono gratuiti.",finishNote:"Il pagamento è disattivato durante la beta pubblica: esportazione e download sono gratuiti.",jpg:"Scarica JPG",pdf:"Scarica PDF",unavailable:"I file beta non sono temporaneamente disponibili. Riprova."},
  zh:{eyebrow:"CardeLume 测试版",title:"你的卡片已准备好下载",description:"测试期间暂不收款。你可以免费下载 JPG 和可打印 PDF。",finishNotice:"公开测试期间已关闭支付，卡片导出与下载完全免费。",finishNote:"公开测试期间已关闭支付，卡片导出与下载完全免费。",jpg:"下载 JPG",pdf:"下载 PDF",unavailable:"测试文件暂时不可用，请稍后重试。"},
  vi:{eyebrow:"CardeLume beta",title:"Thiệp của bạn đã sẵn sàng để tải",description:"CardeLume đang tắt thanh toán trong giai đoạn beta. Anh có thể tải miễn phí JPG và PDF sẵn sàng để in.",finishNotice:"Giai đoạn beta công khai đã tắt thanh toán — xuất file và tải xuống hoàn toàn miễn phí.",finishNote:"Giai đoạn beta công khai đã tắt thanh toán — xuất file và tải xuống hoàn toàn miễn phí.",jpg:"Tải JPG",pdf:"Tải PDF",unavailable:"File beta tạm thời chưa sẵn sàng. Vui lòng thử lại."}
};

const betaTrust:Record<LocaleCode,string[]>={
  en:["No design skills needed","No subscription","Free beta downloads"],
  ja:["デザイン知識は不要","サブスクなし","ベータ期間中は無料ダウンロード"],
  ko:["디자인 지식이 필요 없어요","구독 없음","베타 기간 무료 다운로드"],
  es:["No necesitas saber diseño","Sin suscripción","Descargas beta gratuitas"],
  fr:["Aucune compétence en design requise","Sans abonnement","Téléchargements bêta gratuits"],
  de:["Keine Designkenntnisse nötig","Kein Abo","Kostenlose Beta-Downloads"],
  pt:["Não é preciso saber design","Sem assinatura","Downloads gratuitos na beta"],
  it:["Non serve saper usare il design","Nessun abbonamento","Download beta gratuiti"],
  zh:["无需设计经验","无需订阅","测试期间免费下载"],
  vi:["Không cần biết thiết kế","Không gói định kỳ","Tải miễn phí trong beta"]
};

export function betaCopy(locale:LocaleCode){return {...copy[locale],trust:betaTrust[locale]};}
