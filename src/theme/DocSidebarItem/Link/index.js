import React from 'react';
import Link from '@theme-original/DocSidebarItem/Link';
import {useStudyProgress} from '@site/src/utils/studyProgress';

export default function DocSidebarItemLinkWrapper(props) {
  const {isCompleted} = useStudyProgress();
  const href = props.item?.href;
  const completed = href && isCompleted(href);

  if (!completed) {
    return <Link {...props} />;
  }

  return (
    <Link
      {...props}
      item={{
        ...props.item,
        label: (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: '0.4rem',
            }}>
            <span>{props.item.label}</span>
            <span
              aria-label="Completed"
              title="Completed"
              style={{
                color: 'var(--ifm-color-primary)',
                fontWeight: 700,
                fontSize: '0.85em',
                flexShrink: 0,
              }}>
              ✓
            </span>
          </span>
        ),
      }}
    />
  );
}
