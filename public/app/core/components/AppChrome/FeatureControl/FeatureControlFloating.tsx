import { css } from '@emotion/css';
import type { CSSProperties } from 'react';

import type { GrafanaTheme2 } from '@grafana/data';
import { Portal, useStyles2, useTheme2 } from '@grafana/ui';

import { useChromeHeaderHeight } from '../TopBar/useChromeHeaderHeight';

import { FeatureControlFlags } from './FeatureControlFlags';
import { type FeatureControlCorner, useFeatureControlContext } from './FeatureControlProvider';

const corners: Record<FeatureControlCorner, CSSProperties> = {
  'top-left': { top: 0, right: 'auto', bottom: 'auto', left: 0 },
  'top-right': { top: 0, right: 0, bottom: 'auto', left: 'auto' },
  'bottom-left': { top: 'auto', right: 'auto', bottom: 0, left: 0 },
  'bottom-right': { top: 'auto', right: 0, bottom: 0, left: 'auto' },
};

export const FeatureControlFloating = () => {
  const { corner, isOpen } = useFeatureControlContext();
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const headerHeight = useChromeHeaderHeight();

  if (!isOpen) {
    return null;
  }

  return (
    <Portal zIndex={theme.zIndex.modal}>
      <div className={styles.bounds} style={{ marginTop: `calc(${headerHeight}px + ${theme.spacing(3)})` }}>
        <FeatureControlFlags className={styles.card} style={corners[corner]} />
      </div>
    </Portal>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  bounds: css({
    position: 'fixed',
    inset: 0,
    margin: theme.spacing(3),
    boxSizing: 'border-box',
    pointerEvents: 'none',
  }),
  card: css({
    position: 'absolute',
    width: theme.spacing(50),
    maxHeight: '100%',
    overflowY: 'auto',
    pointerEvents: 'auto',
  }),
});
