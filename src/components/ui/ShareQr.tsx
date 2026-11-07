import { FC } from 'react';

import { QRCodeSVG } from 'qrcode.react';

const ShareQr: FC<{ value: string }> = ({ value }) => (
  <QRCodeSVG
    value={value}
    size={224}
    marginSize={2}
    level='M'
    title='QR code'
    className='h-56 w-56 rounded-lg bg-white'
  />
);

export default ShareQr;
