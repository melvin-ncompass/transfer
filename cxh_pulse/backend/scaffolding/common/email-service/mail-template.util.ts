import { BrandingEnum } from '../enum/enum';

export interface BrandingOptions {
  fontColor: string;
  bgColor: string;
  logo?: string;
  companyName: string;
}

function getLogoHtml(): string {
  return `
    <img
      src="cid:heartbeaticon"
      alt="CxH Pulse by DataKind"
      height="60"
      style="display: block; border: 0; outline: none;"
    />
  `;
}

export const getBrandedWrapper = (
  bodyText: string | string[],
  button?: { text: string; url: string; linkText?: string },
  footerText?: string | string[]
): string => {
  const displayBrandName = BrandingEnum.COMPANY_NAME;

  const bodyHtml = Array.isArray(bodyText)
    ? bodyText.map(p => {
      const isBullet = p.startsWith('•');
      return `<p style="margin: 0 0 ${isBullet ? '4px' : '16px'}; padding-left: ${isBullet ? '10px' : '0'};">
            ${p}
          </p>`;
    }).join('')
    : `<p style="margin: 0 0 16px;">${bodyText}</p>`;

  const footerHtml = footerText ?
    `<div style="
        margin-top: 12px; 
        border-top: 1px solid #E5E7EB; 
        padding-top: 12px; 
        color: #6B7280; 
        font-size: 12px; 
        line-height: 1.5;
    ">
       ${(Array.isArray(footerText) ? footerText : [footerText])
      .map(p => `<p style="margin: 0 0 4px 0;">${p}</p>`).join('')}
    </div>` : '';

  return `
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
  </head>
  <body style="margin: 0; padding: 0">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB;">
            <tr>
              <td style="padding: 30px 30px 10px 30px; text-align: left">
                ${getLogoHtml()}
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 40px; color: #1F2937; line-height: 1.6; font-size: 16px; text-align: left;">
                ${bodyHtml} 
                
                ${button ? `
                <div style="margin-top: 20px">
                  <a href="${button.url}" style="display: inline-block; padding: 10px 20px; background-color: #D32F2F; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    ${button.text}
                  </a>
                </div>
                ` : ''}

                ${footerHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 40px; text-align: left; background-color: #F9FAFB; color: #6B7280; font-size: 12px;">
                <p style="margin: 0">
                  &copy; ${new Date().getFullYear()} DataKind<sup style="font-size: 8px;">®</sup> | ${displayBrandName}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};