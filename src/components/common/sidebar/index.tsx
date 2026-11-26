'use client';

import { buttonStyles } from '@/components/tailgrids/core/button';
import { cn } from '@/utils/cn';
import { AltArrowUpIcon } from '@/utils/icon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { NAV_DATA } from './data';
import { CloseIcon, SidebarExpandedIcon, ThreeDots } from './icon';
import NavItem from './nav-item';
import { findActiveSection } from './utils';

export default function Sidebar({
    isSidebarOpen,
    toggleSidebar,
    isMobileSheet = false,
    onItemClick,
    adminPath = '/admin',
}: {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    isMobileSheet?: boolean;
    onItemClick?: () => void;
    adminPath?: string;
}) {
    const pathname = usePathname();
    const routePath =
        adminPath !== '/admin' &&
        (pathname === adminPath || pathname.startsWith(`${adminPath}/`))
            ? `/admin${pathname.slice(adminPath.length)}`
            : pathname;

    const activeSection = useMemo(
        () => findActiveSection(routePath),
        [routePath],
    );

    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        () => new Set(activeSection ? [activeSection] : ['概览']),
    );

    useEffect(() => {
        if (!activeSection) return;
        setExpandedSections((prev) => {
            if (prev.has(activeSection)) return prev;
            const next = new Set(prev);
            next.add(activeSection);
            return next;
        });
    }, [activeSection]);

    const toggleSection = (label: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    };

    return (
        <div className='flex h-full flex-col overflow-hidden'>
            <div
                className={cn(
                    'flex items-center px-4 pt-7 text-text-primary',
                    isSidebarOpen
                        ? 'justify-between'
                        : 'flex-col justify-center gap-4',
                )}
            >
                <Link href={adminPath} className='flex items-center gap-2'>
                    {isSidebarOpen ? (
                        <>
                            <span className='flex size-8 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white'>M</span>
                            <span className='text-lg font-bold text-text-primary'>MAC CMS</span>
                        </>
                    ) : (
                        <span className='flex size-8 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white'>M</span>
                    )}
                </Link>

                <button
                    onClick={() => toggleSidebar()}
                    className={cn(
                        'p-1.5 transition-colors',
                        isMobileSheet
                            ? 'rounded-lg text-icon-tertiary hover:bg-background-gray-primary hover:text-text-primary'
                            : 'text-icon-tertiary hover:text-text-secondary',
                    )}
                    aria-label={isMobileSheet ? 'Close sidebar' : 'Toggle sidebar'}
                >
                    {isMobileSheet ? <CloseIcon /> : <SidebarExpandedIcon />}
                </button>
            </div>

            <nav
                className={cn(
                    'scrollbar-thin flex-1 overflow-y-auto',
                    isSidebarOpen ? 'mt-5 space-y-1 px-4' : 'mt-5 px-2',
                )}
            >
                {NAV_DATA.map((section) => {
                    const expanded = expandedSections.has(section.label);
                    return (
                        <div key={section.label}>
                            {isSidebarOpen ? (
                                <button
                                    type='button'
                                    onClick={() => toggleSection(section.label)}
                                    aria-expanded={expanded}
                                    className='mt-4 mb-1 flex w-full items-center justify-between rounded-md px-0 py-2 text-xs font-medium tracking-wide text-text-tertiary transition-colors hover:text-text-primary'
                                >
                                    <span>{section.label}</span>
                                    <AltArrowUpIcon
                                        className={cn(
                                            'size-3.5 transition-transform duration-200',
                                            expanded ? 'rotate-0' : 'rotate-180',
                                        )}
                                    />
                                </button>
                            ) : (
                                section.label && (
                                    <span className='flex items-center justify-center pt-5 pb-3 text-icon-secondary'>
                                        <ThreeDots />
                                    </span>
                                )
                            )}

                            {(!isSidebarOpen || expanded) && (
                                <div
                                    className={cn(
                                        'space-y-1',
                                        !isSidebarOpen && 'space-y-1.5',
                                    )}
                                >
                                    {section.items.map((item) => (
                                        <NavItem
                                            key={item.title}
                                            id={item.title}
                                            icon={item.icon}
                                            label={item.title}
                                            href={item.url}
                                            items={item.items}
                                            collapsed={!isSidebarOpen}
                                            currentPath={routePath}
                                            onItemClick={onItemClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {isSidebarOpen && (
                <div className='px-4 py-4'>
                    <div className='rounded-2xl bg-background-gray-primary px-4 py-5 text-center'>
                        <p className='mb-2 leading-6 font-semibold text-text-primary'>
                            MAC CMS 重构版
                        </p>
                        <small className='text-sm leading-5 tracking-[-0.15px] text-text-tertiary'>
                            前台 792 Conch · 后台 NextAdmin
                        </small>
                        <Link
                            href='/'
                            className={buttonStyles({
                                size: 'lg',
                                className: 'mt-4 h-10 w-full bg-brand-500',
                            })}
                            target='_blank'
                        >
                            访问前台
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}