import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSetting, openDatabase, setSetting } from '@/lib/db'; // Added setSetting
import { cn, formatTime } from '@/lib/utils';
import { Feather, Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

type ManageType = 'apps' | 'times' | 'contexts' | 'hobbies';

interface Item {
  id: number;
  name?: string; // for apps/contexts
  name_it?: string; // for apps/contexts
  minutes?: number; // for times
  is_custom: number;
  selected?: boolean; // for hobbies
  category?: string; // for hobbies sorting
  category_it?: string;
}

export default function ManageScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const type = (params.type as ManageType) || 'contexts';
  const colorScheme = useColorScheme();


  const [items, setItems] = useState<Item[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const getTableName = useCallback(() => {
    switch (type) {
      case 'apps': return 'apps';
      case 'times': return 'time_presets'; // table name
      case 'contexts': return 'contexts';
      case 'hobbies': return 'hobbies';
      default: return 'contexts';
    }
  }, [type]);

  const loadItems = useCallback(async () => {
    const db = await openDatabase();
    const table = getTableName();
    let query = `SELECT * FROM ${table}`;
    
    // For times, order by minutes. For others, maybe by name? Or default sort.
    if (type === 'times') {
      query += ' ORDER BY minutes ASC';
    } else {
      // apps/contexts: system first, then custom? Or just mixed. Let's just getAll.
      // Usually better to sort alphabetically if needed, but keeping simple for now.
    }
    
    const result: any[] = await db.getAllAsync(query);

    // For all types, we need to mark selected ones
    let settingKey = '';
    switch(type) {
        case 'hobbies': settingKey = 'selected_hobbies'; break;
        case 'apps': settingKey = 'selected_apps'; break;
        case 'times': settingKey = 'selected_times'; break;
        case 'contexts': settingKey = 'selected_contexts'; break;
    }

    const selectedJson = await getSetting(settingKey);
    let selectedIds: number[] = [];
    if (selectedJson) {
        try { selectedIds = JSON.parse(selectedJson); } catch {}
    } else {
        // If no setting, default all to selected for times/contexts (legacy behavior was show all)
        // For apps/hobbies default might be different but let's assume show all if undefined for consistency or keep current logic.
        // Current logic for apps/hobbies in db.ts is "all if undefined".
        // Let's mimic that here: if undefined, all are selected.
        selectedIds = result.map(r => r.id);
    }
    
    setItems(result.map(r => ({ ...r, selected: selectedIds.includes(r.id) })));
  }, [type, getTableName]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const toggleSelection = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newItems = items.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
    );
    setItems(newItems);

    // Persist immediately
    let settingKey = '';
    switch(type) {
        case 'hobbies': settingKey = 'selected_hobbies'; break;
        case 'apps': settingKey = 'selected_apps'; break;
        case 'times': settingKey = 'selected_times'; break;
        case 'contexts': settingKey = 'selected_contexts'; break;
    }
    const selectedIds = newItems.filter(i => i.selected).map(i => i.id);
    await setSetting(settingKey, JSON.stringify(selectedIds));
  };

  const addOrUpdateItem = async () => {
    if (!inputVal.trim()) return;

    const db = await openDatabase();
    const table = getTableName();

    if (editingId) {
      // Update existing
      if (type === 'times') {
        const mins = parseInt(inputVal);
        if (isNaN(mins)) return; // Should validate better
        await db.runAsync(`UPDATE ${table} SET minutes = ? WHERE id = ?`, mins, editingId);
        setItems(prev => prev.map(c => c.id === editingId ? { ...c, minutes: mins } : c));
      } else {
        await db.runAsync(`UPDATE ${table} SET name = ? WHERE id = ?`, inputVal.trim(), editingId);
        setItems(prev => prev.map(c => c.id === editingId ? { ...c, name: inputVal.trim() } : c));
      }
      setEditingId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Add new
      if (type === 'times') {
        const mins = parseInt(inputVal);
        if (isNaN(mins)) return;
        const res = await db.runAsync(`INSERT INTO ${table} (minutes, is_custom) VALUES (?, 1)`, mins);
        // We reload or manually add to state. State object shape depends on type.
        // Auto-select new time
        const newItem = { id: res.lastInsertRowId, minutes: mins, is_custom: 1, selected: true };
        const newItems = [...items, newItem].sort((a,b) => (a.minutes || 0) - (b.minutes || 0));
        setItems(newItems);

        // Persist selection
        const selectedIds = newItems.filter(i => i.selected).map(i => i.id);
        await setSetting('selected_times', JSON.stringify(selectedIds));
      } else if (type === 'apps') {
          // Apps schema has category, defaults to something? 
          // We only provide name. SQLite allows nulls if nullable or defaults. 
          // Apps schema: name NOT NULL, category TEXT...
          const res = await db.runAsync(`INSERT INTO ${table} (name, is_custom, category) VALUES (?, 1, 'Other')`, inputVal.trim());
          
          // Auto-select new app
          const newItem = { id: res.lastInsertRowId, name: inputVal.trim(), is_custom: 1, selected: true };
          const newItems = [...items, newItem];
          setItems(newItems);

          // Persist selection
          const selectedIds = newItems.filter(i => i.selected).map(i => i.id);
          await setSetting('selected_apps', JSON.stringify(selectedIds));
      } else if (type === 'hobbies') {
         const res = await db.runAsync(`INSERT INTO ${table} (name, is_custom, category) VALUES (?, 1, 'Custom')`, inputVal.trim());
         // Auto-select new hobby
         const newItem = { id: res.lastInsertRowId, name: inputVal.trim(), is_custom: 1, selected: true };
         const newItems = [...items, newItem];
         setItems(newItems);
         // Persist selection
         const selectedIds = newItems.filter(i => i.selected).map(i => i.id);
         await setSetting('selected_hobbies', JSON.stringify(selectedIds));
      } else {
        // contexts
        const res = await db.runAsync(`INSERT INTO ${table} (name, is_custom) VALUES (?, 1)`, inputVal.trim());
        // Auto-select new context
        const newItem = { id: res.lastInsertRowId, name: inputVal.trim(), is_custom: 1, selected: true };
        const newItems = [...items, newItem];
        setItems(newItems);

        // Persist selection
        const selectedIds = newItems.filter(i => i.selected).map(i => i.id);
        await setSetting('selected_contexts', JSON.stringify(selectedIds));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setInputVal('');
  };

  const deleteItem = async (id: number) => {
    const db = await openDatabase();
    const table = getTableName();
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, id);
    
    const newItems = items.filter(c => c.id !== id);
    setItems(newItems);
    
    if (type === 'hobbies' || type === 'apps') {
         // Persist selection update (in case deleted one was selected)
         const settingKey = type === 'hobbies' ? 'selected_hobbies' : 'selected_apps';
         const selectedIds = newItems.filter(i => i.selected).map(i => i.id);
         await setSetting(settingKey, JSON.stringify(selectedIds));
    }

    if (editingId === id) {
      setEditingId(null);
      setInputVal('');
    }
  };

  const startEditing = (item: Item) => {
    let val = '';
    if (type === 'times') {
      val = item.minutes?.toString() || '';
    } else {
      val = item.name || '';
    }
    setInputVal(val);
    setEditingId(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cancelEditing = () => {
    setInputVal('');
    setEditingId(null);
  };

  // Group items
  const systemItems = items.filter(c => !c.is_custom);
  const customItems = items.filter(c => !!c.is_custom);

  // Helper for display name
  const getDisplayName = (item: Item) => {
    if (type === 'times') {
      if (!item.minutes) return '';
      if (item.minutes >= 60) {
        return formatTime(item.minutes, 'long');
      }
      return `${item.minutes}m`;
    }
    return i18n.language === 'it' ? (item.name_it || item.name) : item.name;
  };

  // Translations keys based on type
  const getTitle = () => {
    switch (type) {
      case 'apps': return t('settings.manage_apps');
      case 'times': return t('settings.manage_times');
      case 'contexts': return t('settings.manage_contexts');
      case 'hobbies': return t('settings.manage_hobbies');
    }
  };

  const getSystemTitle = () => {
    switch (type) {
      case 'apps': return t('settings.system_apps');
      case 'times': return t('settings.system_times');
      case 'contexts': return t('settings.system_contexts');
      case 'hobbies': return t('settings.system_hobbies');
    }
  };

  const getCustomTitle = () => {
    switch (type) {
      case 'apps': return t('settings.custom_apps');
      case 'times': return t('settings.custom_times');
      case 'contexts': return t('settings.custom_contexts');
      case 'hobbies': return t('settings.custom_hobbies');
    }
  };

  const getNoCustomText = () => {
    switch (type) {
      case 'apps': return t('settings.no_custom_apps');
      case 'times': return t('settings.no_custom_times');
      case 'contexts': return t('settings.no_custom_contexts');
      case 'hobbies': return t('settings.no_custom_hobbies');
    }
  };

  const getEditTitle = () => editingId ? (
    type === 'apps' ? t('settings.edit_app') :
    type === 'times' ? t('settings.edit_time') :
    type === 'hobbies' ? t('settings.edit_hobby') :
    t('settings.edit_context')
  ) : (
    type === 'apps' ? t('settings.add_new_app') :
    type === 'times' ? t('settings.add_new_time') :
    type === 'hobbies' ? t('settings.add_new_hobby') :
    t('settings.add_new_context')
  );

  const getPlaceholder = () => {
     switch (type) {
      case 'apps': return t('settings.app_placeholder');
      case 'times': return t('settings.time_placeholder');
      case 'contexts': return t('settings.context_placeholder');
      case 'hobbies': return t('settings.hobby_placeholder');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center p-6 border-b border-border/40">
        <TouchableOpacity onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          router.back()
        }} className="mr-4">
          <Ionicons name="chevron-down" size={32} color={colorScheme === 'dark' ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text className="text-3xl font-black text-foreground">{getTitle()}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          contentContainerClassName="pb-48"
          showsVerticalScrollIndicator={false}
        >
          {/* System Items */}
          <View className="mb-8">
            <Text className="text-xl font-bold mb-3 text-foreground">{getSystemTitle()}</Text>
            <View className="flex-row flex-wrap gap-2">
              {systemItems.map(item => (
                <Button
                  key={item.id}
                  onPress={() => {
                      toggleSelection(item.id);
                  }}
                  variant={(item.selected ? 'default' : 'outline')}
                  size="xl"
                  className={cn(" gap-2")}
                >
                  <Text className={cn("text-black dark:text-white", item.selected && "text-white dark:text-black")}>{getDisplayName(item)}</Text>
                  {item.selected && <Ionicons name="checkmark" size={16} color={colorScheme === 'dark' ? 'black' : 'white'} />}
                </Button>
              ))}
            </View>
          </View>

          {/* Custom Items */}
          <View>
            <Text className="text-xl font-bold mb-3 text-foreground">{getCustomTitle()}</Text>
            {customItems.length === 0 ? (
              <Text className="text-muted-foreground italic text-base ml-1">{getNoCustomText()}</Text>
            ) : (
              <View className="flex-row flex-wrap gap-3">
                {customItems.map(item => (
                  <Button
                    key={item.id}
                    onPress={() => {
                        toggleSelection(item.id);
                        if (editingId) setEditingId(null); // Cancel editing if selecting another
                    }}
                    onLongPress={() => {
                        // Optional: Keep long press as shortcut to edit
                        startEditing(item);
                    }}
                    variant={editingId === item.id ? 'default' : (item.selected ? 'default' : 'outline')}
                    size="lg"
                  >
                    <View className="flex-row items-center gap-2">
                       <Text className={cn('text-black dark:text-white', (editingId === item.id || item.selected) && 'text-white dark:text-black')}>
                        {getDisplayName(item)}
                      </Text>
                      {/* Edit Button for Custom Items */}
                       <Pressable
                          onPress={() => {
                             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                             startEditing(item);
                          }}
                          hitSlop={10}
                          className="bg-muted/20 rounded-full p-1 ml-1"
                        >
                          <Feather
                            name="edit"
                            size={10}
                            color={colorScheme === 'dark' ? 'black' : 'white'}
                          />
                        </Pressable>

                      <Pressable
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          deleteItem(item.id);
                        }}
                        hitSlop={10}
                        className="bg-red-500/80 rounded-full p-0.5"
                      >
                        <Ionicons
                          name="close"
                          size={12}
                          color="white"
                        />
                      </Pressable>
                    </View>
                  </Button>
                ))}
              </View>
            )}
            <Text className="text-muted-foreground text-xs mt-4 ml-1">
              {t('settings.manage_custom_hint', 'Tap to select. Use the pencil icon to edit.')}
            </Text>
          </View>

          {/* Add Input Section */}
          <View className="mt-8 bg-card p-4 rounded-3xl border-2 border-border">
            <Text className="text-foreground font-bold mb-3 ml-1">
              {getEditTitle()}
            </Text>
            <View className="flex-row gap-2">
              <Input
                className='bg-input text-foreground flex-1'
                placeholder={getPlaceholder()}
                placeholderTextColor="#94a3b8"
                value={inputVal}
                onChangeText={setInputVal}
                onSubmitEditing={addOrUpdateItem}
                autoCorrect={false}
                keyboardType={type === 'times' ? 'numeric' : 'default'}
              />
              {editingId && (
                <Button
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    cancelEditing()
                  }}
                  variant="outline"
                  className="px-3"
                >
                  <Ionicons name="close" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
                </Button>
              )}
              <Button
                onPress={addOrUpdateItem}
                disabled={!inputVal.trim()}
                className='w-fit'
              >
                <Ionicons
                  name={editingId ? "checkmark" : "add"}
                  size={24}
                  color={
                    editingId && colorScheme === 'dark' ? 'black' 
                    : editingId && colorScheme === 'light' ? 'white' 
                    : colorScheme === 'dark' ? 'black' : 'white'
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
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              router.back()}
            }
            size='xl'
            className='rounded-full w-full'
          >
            <Text className="text-white dark:text-black mx-auto font-semibold text-xl">{t('settings.save_manage')}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
