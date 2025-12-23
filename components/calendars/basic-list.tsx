
import { getCalendarStats, getSetting } from "@/lib/db";
import { formatTime } from "@/lib/utils";
import { Calendar, toDateId, useCalendar } from "@marceloterreiro/flash-calendar";
import { format } from "date-fns";
import { enUS, it } from "date-fns/locale";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from 'react-native';

const today = toDateId(new Date());

export function BasicCalendar() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState(60);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const storedBudget = await getSetting('daily_scroll_budget');
      const budgetVal = storedBudget ? parseInt(storedBudget) : 60;
      const calendarStats = await getCalendarStats();
      
      setBudget(budgetVal);
      setStats(calendarStats);
    } catch (error) {
      console.error("Failed to load calendar data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const renderItem = useCallback(({ item }: any) => {
    return (
      <Month 
        item={item} 
        stats={stats} 
        budget={budget} 
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
    )
  }, [stats, budget, selectedDate]);

  if (loading) {
    return <ActivityIndicator size="large" className="mt-10" />;
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1"> 
        <Calendar.List
          calendarInitialMonthId={today}
          onCalendarDayPress={setSelectedDate}
          renderItem={renderItem}
          calendarFirstDayOfWeek="monday" 
        />
      </View>
    </View>
  );
}

const Month = ({ item, stats, budget, selectedDate, setSelectedDate }: any) => {
    const { i18n } = useTranslation();
    const { weeksList } = useCalendar({
        calendarMonthId: item.id,
        calendarFirstDayOfWeek: "monday",
    });

    const locale = i18n.language === 'it' ? it : enUS;

    // Manually format month and week days for translation
    const [year, month] = item.id.split('-').map(Number);
    const date = new Date(year, month - 1, 15); // Middle of the month to avoid timezone issues
    const displayMonth = format(date, 'MMMM yyyy', { locale });

    // Generate week days starting from Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(2024, 0, 1 + i); // Jan 1 2024 is Monday
      return format(d, 'ccc', { locale });
    });

    return (
        <View className="pb-6 px-4">
          <Calendar.Row.Month height={40}>
            <Text className="text-lg font-bold text-foreground capitalize">
              {displayMonth}
            </Text>
          </Calendar.Row.Month>

          <Calendar.Row.Week>
            {weekDays.map((day: string, i: number) => (
              <Calendar.Item.WeekName key={i} height={30}>
                <Text className="text-muted-foreground text-xs uppercase font-semibold">
                  {day}
                </Text>
              </Calendar.Item.WeekName>
            ))}
          </Calendar.Row.Week>

          {weeksList.map((week: any[], i: number) => (
            <Calendar.Row.Week key={i}>
              {week.map((day: any, j: number) => (
                <Day 
                  key={j} 
                  metadata={day} 
                  stats={stats} 
                  budget={budget}
                  selectedDate={selectedDate}
                  onPress={setSelectedDate}
                />
              ))}
            </Calendar.Row.Week>
          ))}
        </View>
    )
}

const Day = ({ metadata, stats, budget, selectedDate, onPress }: any) => {
  const { isDifferentMonth, date } = metadata;
  const dateId = toDateId(date);
  const minutes = stats[dateId] || 0;
  const hasLog = stats.hasOwnProperty(dateId);
  
  // Logic for coloring
  // If not logged, dashed (unless "future" or "different month" - actually different month usually hidden or dimmed)
  const isLogged = hasLog;

  
  // We only color "current month" days usually, or valid days.
  // If different month, usually dimmed.
    
  const percentage = (minutes / budget) * 100;
  
  let backgroundColor = "transparent";
  let textColor = isDifferentMonth ? "#a1a1aa" : "#09090b"; 
  // Handle dark mode text color? #09090b is black. We typically want text-foreground.
  // Since I can't easily check scheme here without hook, I'll use standard text-foreground class if possible?
  // But `Calendar.Item.Day` expects styles or I can render custom content.
  // My content is View/Text.

  if (isLogged) {
    if (percentage > 100) {
      backgroundColor = "#a855f7"; // purple-500
      textColor = "white";
    } else if (percentage > 50) {
      backgroundColor = "#ef4444"; // red-500
      textColor = "white";
    } else if (percentage > 25) {
      backgroundColor = "#eab308"; // yellow-500
      textColor = "white"; 
    } else {
      backgroundColor = "#22c55e"; // green-500
      textColor = "white";
    }
  }
  
  return (
    <Calendar.Item.Day
      metadata={metadata}
      onPress={onPress}
      height={48}
    >
      <View 
        className="w-full h-full items-center justify-center rounded-xl m-0.5 border-2 flex-col"
        style={{
          backgroundColor: backgroundColor,
          borderColor: "transparent",
        }}
        >
        <Text 
          className={isDifferentMonth ? "text-foreground" : (isLogged ? "" : "text-foreground")}
          style={{ marginBottom: 8 }}
        >
          {date.getDate()}
        </Text>
          
        {isLogged && (
          <Text className="text-foreground" style={{ fontSize: 10, color: textColor, fontWeight: "bold", position: 'absolute', bottom: 5 }}>
            {formatTime(minutes)}
          </Text>
        )}
      </View>
    </Calendar.Item.Day>
  )
}

