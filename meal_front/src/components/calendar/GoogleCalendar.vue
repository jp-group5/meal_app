<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { gapi } from 'gapi-script';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { MealType } from '@/types';

interface CalendarDisplayEvent {
  id: string
  title: string
  date: string
  mealType?: MealType
  start?: string
  end?: string
  description?: string
  location?: string
  htmlLink?: string
}

const props = withDefaults(
  defineProps<{
    mealEvents?: CalendarDisplayEvent[]
    selectedDate?: string
  }>(),
  {
    mealEvents: () => [],
    selectedDate: '',
  },
);

const emit = defineEmits<{
  'date-selected': [date: string]
  'events-loaded': [events: CalendarDisplayEvent[]]
}>();

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DEFAULT_MEAL_COLOR = '#6b7280';
const MEAL_TYPE_COLORS: Record<MealType, string> = {
  breakfast: '#c46a18',
  lunch: '#1f7a5a',
  dinner: '#6f4bb4',
  snack: '#2f6f9f',
};

const googleEvents = ref<CalendarDisplayEvent[]>([]);
const isAuthReady = ref(false);
const authMessage = ref('');

const calendarOptions = reactive({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  events: [] as any[],
  height: 'auto',
  headerToolbar: {
    left: 'title',
    center: '',
    right: 'prev,next today',
  },
  eventDidMount: (info: any) => {
    const eventDate = info.event.extendedProps?.date ?? toDateKey(info.event.start);

    if (eventDate) {
      info.el.setAttribute('data-event-date', eventDate);
    }
  },
});

let tokenClient: any;

watch(
  () => props.mealEvents,
  () => {
    syncCalendarEvents();
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  void initializeGoogleCalendar();
});

const handleAuth = () => {
  if (!tokenClient) {
    authMessage.value = 'Google Calendar sign-in is not ready yet.';
    return;
  }

  tokenClient.requestAccessToken();
};

async function initializeGoogleCalendar() {
  gapi.load('client', async () => {
    try {
      await gapi.client.init({
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      });
    } catch (error) {
      authMessage.value = 'Google Calendar API could not be initialized.';
      console.error('Calendar client initialization error:', error);
    }
  });

  if (!CLIENT_ID) {
    authMessage.value = 'Google Calendar client ID is not configured.';
    return;
  }

  const googleOAuth = await waitForGoogleOAuth();

  if (!googleOAuth) {
    authMessage.value = 'Google sign-in is still loading. Refresh if calendar access is unavailable.';
    return;
  }

  tokenClient = googleOAuth.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (tokenResponse: any) => {
      if (tokenResponse.error !== undefined) {
        console.error('Login error:', tokenResponse);
        return;
      }

      await listEvents();
    },
  });

  isAuthReady.value = true;
  authMessage.value = '';
}

const listEvents = async () => {
  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 100,
      orderBy: 'startTime',
    });

    googleEvents.value = response.result.items.map((event: any) => ({
      id: event.id,
      title: event.summary ?? '(Untitled event)',
      date: toDateKey(event.start.dateTime || event.start.date),
      start: event.start.dateTime || event.start.date,
      end: event.end?.dateTime || event.end?.date,
      description: event.description,
      location: event.location,
      htmlLink: event.htmlLink,
    }));

    emit('events-loaded', googleEvents.value);
    syncCalendarEvents();
  } catch (err) {
    console.error('Calendar fetch error:', err);
  }
};

function syncCalendarEvents() {
  calendarOptions.events = [
    ...props.mealEvents.map((event) => {
      const mealColor = getMealColor(event.mealType);

      return {
        id: `meal-${event.id}`,
        title: event.title,
        start: event.date,
        allDay: true,
        backgroundColor: mealColor,
        borderColor: mealColor,
        extendedProps: {
          ...event,
          source: 'meal',
        },
      };
    }),
    ...googleEvents.value.map((event) => ({
      id: `google-${event.id}`,
      title: event.title,
      start: event.start ?? event.date,
      end: event.end,
      backgroundColor: '#1f6f63',
      borderColor: '#1f6f63',
      extendedProps: {
        ...event,
        source: 'google',
      },
    })),
  ];
}

function handleCalendarClick(event: MouseEvent) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const eventElement = target.closest<HTMLElement>('[data-event-date]');
  const eventDate = eventElement?.dataset.eventDate;

  if (eventDate) {
    emit('date-selected', eventDate);
    return;
  }

  const dayElement = target.closest<HTMLElement>('.fc-daygrid-day[data-date]');
  const dayDate = dayElement?.dataset.date;

  if (dayDate) {
    emit('date-selected', dayDate);
  }
}

function getMealColor(mealType: MealType | undefined) {
  return mealType ? MEAL_TYPE_COLORS[mealType] : DEFAULT_MEAL_COLOR;
}

function waitForGoogleOAuth() {
  return new Promise<any | null>((resolve) => {
    let attempts = 0;

    const checkGoogleOAuth = () => {
      const googleOAuth = (window as any).google?.accounts?.oauth2;

      if (googleOAuth) {
        resolve(googleOAuth);
        return;
      }

      attempts += 1;

      if (attempts >= 20) {
        resolve(null);
        return;
      }

      window.setTimeout(checkGoogleOAuth, 150);
    };

    checkGoogleOAuth();
  });
}

function toDateKey(value: string | Date | null | undefined) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return toLocalDateKey(value);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime())) {
    return toLocalDateKey(parsedDate);
  }

  return value.slice(0, 10);
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
</script>

<template>
  <div class="calendar-container">
    <div class="header-actions">
      <h2>Google Calendar integration</h2>
      <button class="auth-button" type="button" :disabled="!isAuthReady" @click="handleAuth">Access calendar</button>
    </div>

    <p class="calendar-hint">
      Meal colors show type. Google Calendar activities are shown in green. Select a date to open the detail view.
    </p>
    <p v-if="authMessage" class="auth-message">{{ authMessage }}</p>
    
    <div class="calendar-wrapper" @click="handleCalendarClick">
      <FullCalendar :options="calendarOptions" />
    </div>
  </div>
</template>

<style scoped>
.calendar-container {
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions h2 {
  margin: 0;
  color: #18212f;
}

.auth-button {
  background-color: #1f6f63;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.auth-button:hover {
  background-color: #185a50;
}

.auth-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.calendar-hint {
  margin: 0 0 1rem;
  color: #5c6a78;
  font-size: 0.9rem;
}

.auth-message {
  margin: 0 0 1rem;
  border: 1px solid #f0d6a5;
  border-radius: 8px;
  background: #fff8eb;
  color: #805b20;
  padding: 0.55rem 0.7rem;
  font-size: 0.86rem;
}

.calendar-wrapper {
  --fc-button-bg-color: #1f6f63;
  --fc-button-border-color: #1f6f63;
  --fc-button-hover-bg-color: #185a50;
  --fc-button-hover-border-color: #185a50;
  --fc-button-active-bg-color: #185a50;
  --fc-button-active-border-color: #185a50;
  font-family: inherit;
}

:deep(.fc-daygrid-day),
:deep(.fc-event) {
  cursor: pointer;
}
</style>
