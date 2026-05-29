<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
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

interface GoogleCalendarApiEvent {
  id?: string
  summary?: string
  start?: {
    dateTime?: string
    date?: string
  }
  end?: {
    dateTime?: string
    date?: string
  }
  description?: string
  location?: string
  htmlLink?: string
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarApiEvent[]
  error?: {
    message?: string
  }
}

interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface GoogleAuthError {
  type?: string
  message?: string
}

interface GoogleTokenClient {
  requestAccessToken: () => void
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (tokenResponse: GoogleTokenResponse) => void | Promise<void>
    error_callback?: (error: GoogleAuthError) => void
  }) => GoogleTokenClient
}

interface GoogleIdentityNamespace {
  accounts?: {
    oauth2?: GoogleOAuth2
  }
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
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const GOOGLE_CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
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
const calendarWrapper = ref<HTMLElement | null>(null);

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
  datesSet: () => {
    syncSelectedDateHighlight();
  },
});

let tokenClient: GoogleTokenClient | undefined;

watch(
  () => props.mealEvents,
  () => {
    syncCalendarEvents();
  },
  { deep: true, immediate: true },
);

watch(
  () => props.selectedDate,
  () => {
    syncSelectedDateHighlight();
  },
  { immediate: true },
);

onMounted(() => {
  void initializeGoogleCalendar();
});

const handleAuth = () => {
  if (!tokenClient) {
    authMessage.value = 'Google Calendar sign-in is not ready yet.';
    return;
  }

  authMessage.value = '';
  tokenClient.requestAccessToken();
};

function handleDateInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('date-selected', target.value);
}

async function initializeGoogleCalendar() {
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
    callback: async (tokenResponse) => {
      if (tokenResponse.error !== undefined) {
        console.error('Login error:', tokenResponse);
        authMessage.value =
          tokenResponse.error_description ?? `Google Calendar sign-in failed: ${tokenResponse.error}`;
        return;
      }

      if (!tokenResponse.access_token) {
        authMessage.value = 'Google Calendar sign-in completed, but no access token was returned.';
        return;
      }

      await listEvents(tokenResponse.access_token);
    },
    error_callback: (error) => {
      authMessage.value = getGoogleAuthErrorMessage(error);
      console.error('Login popup error:', error);
    },
  });

  isAuthReady.value = true;
  authMessage.value = '';
}

const listEvents = async (accessToken: string) => {
  try {
    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - 1);

    const url = new URL(GOOGLE_CALENDAR_EVENTS_URL);
    url.search = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      showDeleted: 'false',
      singleEvents: 'true',
      maxResults: '100',
      orderBy: 'startTime',
    }).toString();

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = (await response.json()) as GoogleCalendarEventsResponse;

    if (!response.ok) {
      throw new Error(result.error?.message ?? `Google Calendar request failed (${response.status})`);
    }

    googleEvents.value = (result.items ?? []).map((event, index) => {
      const start = event.start?.dateTime ?? event.start?.date ?? '';
      const end = event.end?.dateTime ?? event.end?.date;

      return {
        id: event.id ?? `google-event-${index}-${start}`,
        title: event.summary ?? '(Untitled event)',
        date: toDateKey(start),
        start,
        end,
        description: event.description,
        location: event.location,
        htmlLink: event.htmlLink,
      };
    });

    authMessage.value = '';
    emit('events-loaded', googleEvents.value);
    syncCalendarEvents();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    authMessage.value = `Google Calendar events could not be loaded: ${message}`;
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

function syncSelectedDateHighlight() {
  void nextTick(() => {
    const wrapper = calendarWrapper.value;

    if (!wrapper) {
      return;
    }

    wrapper.querySelectorAll<HTMLElement>('.fc-daygrid-day.is-selected-date').forEach((day) => {
      day.classList.remove('is-selected-date');
    });

    if (!props.selectedDate) {
      return;
    }

    wrapper.querySelectorAll<HTMLElement>('.fc-daygrid-day[data-date]').forEach((day) => {
      if (day.dataset.date === props.selectedDate) {
        day.classList.add('is-selected-date');
      }
    });
  });
}

function getMealColor(mealType: MealType | undefined) {
  return mealType ? MEAL_TYPE_COLORS[mealType] : DEFAULT_MEAL_COLOR;
}

function getGoogleAuthErrorMessage(error: GoogleAuthError) {
  if (error.type === 'popup_failed_to_open') {
    return 'Google sign-in popup could not open. Allow pop-ups and try again.';
  }

  if (error.type === 'popup_closed') {
    return 'Google sign-in was closed before authorization finished.';
  }

  return error.message ?? 'Google Calendar sign-in could not be completed.';
}

function waitForGoogleOAuth() {
  return new Promise<GoogleOAuth2 | null>((resolve) => {
    let attempts = 0;

    const checkGoogleOAuth = () => {
      const googleOAuth = (window as Window & { google?: GoogleIdentityNamespace }).google?.accounts
        ?.oauth2;

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
      <h2>Calendar</h2>
      <div class="calendar-toolbar">
        <input
          :value="selectedDate"
          type="date"
          aria-label="Select date"
          @input="handleDateInput"
        />
        <button class="auth-button" type="button" :disabled="!isAuthReady" @click="handleAuth">
          Connect
        </button>
      </div>
    </div>

    <p class="calendar-hint">
      Select a date to view meals and activities.
    </p>
    <p v-if="authMessage" class="auth-message">{{ authMessage }}</p>
    
    <div ref="calendarWrapper" class="calendar-wrapper" @click="handleCalendarClick">
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

.calendar-toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
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

:deep(.fc-daygrid-day.is-selected-date) {
  background: #eef9f6;
  box-shadow: inset 0 0 0 2px #0f766e;
}

:deep(.fc-daygrid-day.is-selected-date .fc-daygrid-day-frame) {
  background: linear-gradient(180deg, rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.03));
}

:deep(.fc-daygrid-day.is-selected-date .fc-daygrid-day-number) {
  margin: 0.25rem;
  min-width: 1.8rem;
  border-radius: 999px;
  background: #0f766e;
  color: #ffffff;
  font-weight: 800;
  text-align: center;
}
</style>
