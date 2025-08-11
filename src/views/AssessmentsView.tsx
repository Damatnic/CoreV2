import React, { useState } from 'react';
import { ActiveView } from '../types';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { ViewHeader } from '../components/ViewHeader';
import { culturalContextService } from '../services/culturalContextService';

export const AssessmentsView: React.FC<{
    setActiveView: (view: ActiveView) => void;
}> = ({ setActiveView }) => {
    const [showCulturalOption, setShowCulturalOption] = useState(false);
    const [selectedCulturalContext, setSelectedCulturalContext] = useState(
        culturalContextService.getCulturalContext('en').region
    );

    const startAssessment = (type: 'phq-9' | 'gad-7', cultural: boolean = false) => {
        setActiveView({
            view: 'assessment-detail',
            params: {
                type,
                ...(cultural && {
                    culturalContext: selectedCulturalContext,
                    cultural: true
                })
            }
        });
    };

    return (
        <>
            <ViewHeader
                title="Mental Health Assessments"
                subtitle="Private, evidence-based tools to help you understand your well-being."
            />

            {/* Cultural Assessment Option */}
            <Card style={{ marginBottom: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.25rem', marginTop: '0.125rem' }}>🌍</span>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>
                            Culturally-Adapted Assessments Available
                        </h3>
                        <p style={{ color: '#1e40af', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                            Get assessments adapted for your cultural context that respect cultural differences in mental health expression.
                        </p>
                        <AppButton
                            variant="secondary"
                            onClick={() => setShowCulturalOption(!showCulturalOption)}
                            style={{ fontSize: '0.875rem' }}
                        >
                            {showCulturalOption ? 'Hide' : 'Show'} Cultural Options
                        </AppButton>
                    </div>
                </div>
            </Card>

            {/* Cultural Context Selection */}
            {showCulturalOption && (
                <Card style={{ marginBottom: '1rem', backgroundColor: '#f8fafc' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>
                        Select Cultural Context
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                        {culturalContextService.getCulturalRegions().map(context => (
                            <AppButton
                                key={context}
                                variant={context === selectedCulturalContext ? 'primary' : 'secondary'}
                                onClick={() => setSelectedCulturalContext(context)}
                                style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                            >
                                {context}
                            </AppButton>
                        ))}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                        Cultural adaptations include language-specific mental health expressions, cultural bias reduction, and culturally-appropriate recommendations.
                    </p>
                </Card>
            )}

            <Card>
                <h2>Available Assessments</h2>
                <p>These are standardized, confidential screening tools. They are not a diagnosis but can be a helpful starting point for self-awareness or a conversation with a professional.</p>
                <div className="assessment-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="setting-item">
                        <div>
                            <h3 style={{ margin: 0 }}>PHQ-9 (Depression)</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Screens for and measures the severity of depression.</p>
                            {showCulturalOption && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        backgroundColor: '#e0f2fe', 
                                        color: '#0369a1', 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '0.25rem' 
                                    }}>
                                        Cultural Adaptation: {selectedCulturalContext}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <AppButton onClick={() => startAssessment('phq-9', false)}>
                                Standard Assessment
                            </AppButton>
                            {showCulturalOption && (
                                <AppButton 
                                    variant="secondary" 
                                    onClick={() => startAssessment('phq-9', true)}
                                    style={{ fontSize: '0.875rem' }}
                                >
                                    Cultural Assessment ({selectedCulturalContext})
                                </AppButton>
                            )}
                        </div>
                    </div>
                     <hr style={{margin: '1rem 0', border: 'none', borderBottom: '1px solid var(--border-color)'}}/>
                    <div className="setting-item">
                        <div>
                            <h3 style={{ margin: 0 }}>GAD-7 (Anxiety)</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Screens for and measures the severity of generalized anxiety disorder.</p>
                            {showCulturalOption && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        backgroundColor: '#e0f2fe', 
                                        color: '#0369a1', 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '0.25rem' 
                                    }}>
                                        Cultural Adaptation: {selectedCulturalContext}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <AppButton onClick={() => startAssessment('gad-7', false)}>
                                Standard Assessment
                            </AppButton>
                            {showCulturalOption && (
                                <AppButton 
                                    variant="secondary" 
                                    onClick={() => startAssessment('gad-7', true)}
                                    style={{ fontSize: '0.875rem' }}
                                >
                                    Cultural Assessment ({selectedCulturalContext})
                                </AppButton>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
            <Card>
                 <div className="setting-item">
                     <p>View your past assessment results to track your progress over time.</p>
                     <AppButton variant="secondary" onClick={() => setActiveView({ view: 'assessment-history' })}>View History</AppButton>
                </div>
            </Card>
        </>
    );
};

export default AssessmentsView;