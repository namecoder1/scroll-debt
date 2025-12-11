import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { openDatabase } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContextsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [contexts, setContexts] = useState<{ id: number, name: string, name_it?: string, is_custom: number }[]>([]);
  const [contextInput, setContextInput] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadContexts();
  }, []);

  const loadContexts = async () => {
    const db = await openDatabase();
    const result: any[] = await db.getAllAsync('SELECT * FROM contexts');
    setContexts(result);
  };

  const addOrUpdateContext = async () => {
    if (!contextInput.trim()) return;

    const db = await openDatabase();

    if (editingId) {
      // Update existing
      await db.runAsync('UPDATE contexts SET name = ? WHERE id = ?', contextInput.trim(), editingId);
      setContexts(prev => prev.map(c => c.id === editingId ? { ...c, name: contextInput.trim() } : c));
      setEditingId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Add new
      const res = await db.runAsync('INSERT INTO contexts (name, is_custom) VALUES (?, 1)', contextInput.trim());
      setContexts(prev => [...prev, { id: res.lastInsertRowId, name: contextInput.trim(), is_custom: 1 }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setContextInput('');
  };

  const deleteContext = async (id: number) => {
    const db = await openDatabase();
    await db.runAsync('DELETE FROM contexts WHERE id = ?', id);
    setContexts(prev => prev.filter(c => c.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setContextInput('');
    }
  };

  const startEditing = (context: { id: number, name: string, name_it?: string }) => {
    // If editing a system context (which shouldn't happen based on UI logic but just in case), use locale name?
    // Actually custom contexts won't have name_it, so just name.
    setContextInput(context.name);
    setEditingId(context.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cancelEditing = () => {
    setContextInput('');
    setEditingId(null);
  };

  // Group contexts
  const systemContexts = contexts.filter(c => !c.is_custom);
  const customContexts = contexts.filter(c => !!c.is_custom);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center p-6 border-b border-border/40">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-down" size={32} color={colorScheme === 'dark' ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text className="text-3xl font-black text-foreground">{t('settings.manage_contexts')}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          contentContainerClassName="pb-48"
          showsVerticalScrollIndicator={false}
        >
          {/* System Contexts */}
          <View className="mb-8">
            <Text className="text-xl font-bold mb-3 text-foreground">{t('settings.system_contexts')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {systemContexts.map(ctx => (
                <Button
                  key={ctx.id}
                  onPress={() => { }}
                  variant="outline"
                  size="lg"
                  className="pointer-events-none opacity-80"
                >
                  <Text className="text-foreground">{i18n.language === 'it' ? (ctx.name_it || ctx.name) : ctx.name}</Text>
                </Button>
              ))}
            </View>
          </View>

          {/* Custom Contexts */}
          <View>
            <Text className="text-xl font-bold mb-3 text-foreground">{t('settings.custom_contexts')}</Text>
            {customContexts.length === 0 ? (
              <Text className="text-muted-foreground italic text-base ml-1">{t('settings.no_custom_contexts')}</Text>
            ) : (
              <View className="flex-row flex-wrap gap-3">
                {customContexts.map(ctx => (
                  <Button
                    key={ctx.id}
                    onPress={() => startEditing(ctx)}
                    variant={editingId === ctx.id ? 'default' : 'outline'}
                    size="lg"
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className={cn('text-black dark:text-white', editingId === ctx.id && 'text-white dark:text-black')}>
                        {ctx.name}
                      </Text>
                      {editingId === ctx.id && (
                        <Pressable
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            deleteContext(ctx.id);
                          }}
                          hitSlop={10}
                          className="bg-black/10 dark:bg-white/20 rounded-full p-0.5"
                        >
                          <Ionicons
                            name="close"
                            size={12}
                            color={editingId === ctx.id ? 'white' : (colorScheme === 'dark' ? 'white' : 'black')}
                          />
                        </Pressable>
                      )}
                    </View>
                  </Button>
                ))}
              </View>
            )}
            <Text className="text-muted-foreground text-xs mt-4 ml-1">
              {t('settings.tap_to_edit_hint')}
            </Text>
          </View>

          {/* Add Input Section (Card Style like Apps) */}
          <View className="mt-8 bg-card p-4 rounded-2xl border-2 border-border">
            <Text className="text-foreground font-bold mb-3 ml-1">
              {editingId ? t('settings.edit_context') : t('settings.add_new_context')}
            </Text>
            <View className="flex-row gap-2">
              <Input
                className='bg-input text-foreground flex-1'
                placeholder={t('settings.context_placeholder')}
                placeholderTextColor="#94a3b8"
                value={contextInput}
                onChangeText={setContextInput}
                onSubmitEditing={addOrUpdateContext}
                autoCorrect={false}
              />
              {editingId && (
                <Button
                  onPress={cancelEditing}
                  variant="outline"
                  className="px-3"
                >
                  <Ionicons name="close" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
                </Button>
              )}
              <Button
                onPress={addOrUpdateContext}
                disabled={!contextInput.trim()}
                className='w-fit'
                variant={editingId ? 'default' : 'outline'}
              >
                <Ionicons
                  name={editingId ? "checkmark" : "add"}
                  size={24}
                  color={
                    editingId
                      ? "white"
                      : (colorScheme === 'dark' && contextInput.trim() ? "white"
                        : colorScheme === 'light' && contextInput.trim() ? "black"
                          : colorScheme === 'dark' && !contextInput.trim() ? 'white'
                            : 'black')
                  }
                />
              </Button>
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,1)']}
                locations={[0, 0.6, 0.8, 1]}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <BlurView
              intensity={100}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </MaskedView>
        </View>

        <View className="absolute bottom-6 left-6 right-6">
          <Button
            onPress={() => router.back()}
            size='xl'
            className='rounded-full w-full'
          >
            <Text className="text-primary-foreground mx-auto font-black text-xl">Done</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
