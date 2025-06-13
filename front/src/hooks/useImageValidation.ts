import { useState, useEffect } from 'react';
import ImageConfig, { ImageConfigData } from '../services/ImageConfig';

export const useImageValidation = (type: 'equipment' | 'room') => {
    const [config, setConfig] = useState<ImageConfigData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const imageConfig = type === 'equipment'
                    ? await ImageConfig.getEquipmentImageConfig()
                    : await ImageConfig.getRoomImageConfig();
                setConfig(imageConfig);
            } catch (error) {
                console.error('Erreur chargement config images:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [type]);

    const validateFile = (file: File): string | null => {
        if (!config) return "Configuration en cours de chargement...";
        return ImageConfig.validateFile(file, config);
    };

    const getMaxSizeMB = (): number => {
        return config ? Math.round(config.maxFileSize / (1024 * 1024)) : 5;
    };

    const getAcceptedTypes = (): string => {
        return config ? config.allowedMimeTypes.join(',') : 'image/*';
    };

    const getAcceptedExtensions = (): string => {
        return config ? config.allowedExtensions.join(', ').toUpperCase() : 'JPG, PNG';
    };

    const isConfigReady = (): boolean => {
        return !loading && config !== null;
    };

    return {
        config,
        loading,
        validateFile,
        getMaxSizeMB,
        getAcceptedTypes,
        getAcceptedExtensions,
        isConfigReady
    };
};