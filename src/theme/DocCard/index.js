import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import isInternalUrl from '@docusaurus/isInternalUrl';
import Heading from '@theme/Heading';
import Icon, { iconForUrl, accentForUrl } from '@site/src/components/Icon';
import styles from './styles.module.css';

// Removes a leading emoji from a label (the default cards put one there).
function cleanTitle(label) {
  return label.replace(/^\p{Extended_Pictographic}️?\s*/u, '').trim();
}

function CardLayout({ href, iconName, accent, title, description, className }) {
  return (
    <Link
      href={href}
      className={clsx('card padding--lg', styles.cardContainer, className)}
      style={{ '--card-accent': accent }}
    >
      <div className={styles.cardRow}>
        <span className={styles.iconBadge}>
          <Icon name={iconName} size={26} />
        </span>
        <div className={styles.cardText}>
          <Heading as="h2" className={clsx('text--truncate', styles.cardTitle)} title={title}>
            {title}
          </Heading>
          {description && (
            <p className={clsx('text--truncate', styles.cardDescription)} title={description}>
              {description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function CardCategory({ item }) {
  const href = findFirstSidebarItemLink(item);
  if (!href) return null;
  const n = item.items.length;
  const url = item.href ?? href;
  return (
    <CardLayout
      href={href}
      className={item.className}
      iconName={item.customProps?.icon ?? iconForUrl(url, 'folder')}
      accent={accentForUrl(url)}
      title={cleanTitle(item.label)}
      description={item.description ?? `${n} ${n === 1 ? 'item' : 'items'}`}
    />
  );
}

function CardLink({ item }) {
  const doc = useDocById(item.docId ?? undefined);
  const internal = isInternalUrl(item.href);
  return (
    <CardLayout
      href={item.href}
      className={item.className}
      iconName={item.customProps?.icon ?? (internal ? iconForUrl(item.href) : 'link')}
      accent={accentForUrl(item.href)}
      title={cleanTitle(item.label)}
      description={item.description ?? doc?.description}
    />
  );
}

export default function DocCard({ item }) {
  switch (item.type) {
    case 'link':
      return <CardLink item={item} />;
    case 'category':
      return <CardCategory item={item} />;
    default:
      throw new Error(`unknown item type ${JSON.stringify(item)}`);
  }
}
