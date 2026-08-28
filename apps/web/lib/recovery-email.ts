import type { LocaleCode } from "../i18n/messages";

const copy:Record<LocaleCode,{subject:string;intro:string;cta:string;note:string}>={
  en:{subject:"Your CardeLume recovery link",intro:"Your card is yours. Use this private link if you ever need to restore access to the files from this purchase.",cta:"Restore my CardeLume files",note:"Keep this link private. Download links created from the recovery page expire shortly after they are issued."},
  ja:{subject:"CardeLumeの復元リンク",intro:"購入したカードはあなたのものです。必要なときは、この非公開リンクから購入ファイルへのアクセスを復元できます。",cta:"CardeLumeファイルを復元",note:"このリンクは他の人と共有しないでください。復元ページから発行されるダウンロードリンクは短時間で期限切れになります。"},
  ko:{subject:"CardeLume 복구 링크",intro:"구매한 카드는 당신의 것입니다. 필요할 때 이 비공개 링크로 구매 파일 접근을 복구할 수 있어요.",cta:"CardeLume 파일 복구",note:"이 링크는 다른 사람과 공유하지 마세요. 복구 페이지에서 생성되는 다운로드 링크는 짧은 시간 후 만료됩니다."},
  es:{subject:"Tu enlace de recuperación de CardeLume",intro:"La tarjeta que compraste es tuya. Usa este enlace privado si alguna vez necesitas recuperar el acceso a los archivos de esta compra.",cta:"Recuperar mis archivos CardeLume",note:"Mantén este enlace en privado. Los enlaces de descarga generados desde la página de recuperación caducan poco después de emitirse."},
  fr:{subject:"Votre lien de récupération CardeLume",intro:"La carte achetée vous appartient. Utilisez ce lien privé si vous avez besoin de rétablir l’accès aux fichiers de cet achat.",cta:"Récupérer mes fichiers CardeLume",note:"Gardez ce lien privé. Les liens de téléchargement créés depuis la page de récupération expirent rapidement."},
  de:{subject:"Ihr CardeLume-Wiederherstellungslink",intro:"Die gekaufte Karte gehört Ihnen. Mit diesem privaten Link können Sie den Zugang zu den Dateien dieses Kaufs bei Bedarf wiederherstellen.",cta:"CardeLume-Dateien wiederherstellen",note:"Bewahren Sie diesen Link privat auf. Download-Links von der Wiederherstellungsseite laufen kurz nach ihrer Erstellung ab."},
  pt:{subject:"Seu link de recuperação CardeLume",intro:"O cartão comprado é seu. Use este link privado se precisar recuperar o acesso aos arquivos desta compra.",cta:"Recuperar meus arquivos CardeLume",note:"Mantenha este link privado. Os links de download criados na página de recuperação expiram pouco depois de serem emitidos."},
  it:{subject:"Il tuo link di recupero CardeLume",intro:"Il biglietto acquistato è tuo. Usa questo link privato se avrai bisogno di ripristinare l’accesso ai file di questo acquisto.",cta:"Recupera i miei file CardeLume",note:"Mantieni privato questo link. I link di download creati dalla pagina di recupero scadono poco dopo essere stati emessi."},
  zh:{subject:"你的CardeLume恢复链接",intro:"你购买的卡片属于你。如果以后需要重新访问此次购买的文件，请使用这个私密链接。",cta:"恢复我的CardeLume文件",note:"请勿分享此链接。恢复页面生成的下载链接会在很短时间后过期。"},
  vi:{subject:"Link khôi phục CardeLume của bạn",intro:"Tấm thiệp bạn đã mua thuộc về bạn. Hãy dùng link riêng tư này nếu sau này cần lấy lại quyền truy cập các file của giao dịch này.",cta:"Khôi phục file CardeLume",note:"Hãy giữ link này riêng tư. Các link tải được tạo từ trang khôi phục sẽ hết hạn sau thời gian ngắn."}
};

export function buildRecoveryEmail(locale:LocaleCode,claimUrl:string){
  const t=copy[locale];
  return{
    subject:t.subject,
    text:`${t.intro}\n\n${t.cta}:\n${claimUrl}\n\n${t.note}`
  };
}
