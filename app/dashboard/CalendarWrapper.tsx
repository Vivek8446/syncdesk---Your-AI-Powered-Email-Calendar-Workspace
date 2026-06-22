"use client";

import React, { forwardRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface CalendarWrapperProps {
  events?: any[];
}

export const CalendarWrapper = forwardRef<FullCalendar, CalendarWrapperProps>(
  ({ events: propEvents }, ref) => {
    // Reference events matching the screenshot
    const defaultEvents = [
      {
        id: "1",
        title: "Marketing Sync",
        start: "2024-05-13T10:00:00",
        end: "2024-05-13T11:30:00",
        extendedProps: {
          subtitle: "Google Meet",
          bgClass: "bg-[#89D7B7]/15",
          borderClass: "border-[#89D7B7]",
        },
      },
      {
        id: "2",
        title: "Product Review",
        start: "2024-05-14T13:00:00",
        end: "2024-05-14T14:30:00",
        extendedProps: {
          subtitle: "Main Conference",
          bgClass: "bg-[#428475]/30",
          borderClass: "border-[#89D7B7]/60",
        },
      },
      {
        id: "3",
        title: "Deep Work",
        start: "2024-05-15T11:00:00",
        end: "2024-05-15T12:30:00",
        extendedProps: {
          subtitle: "Focus Zone",
          bgClass: "bg-amber-650/15",
          borderClass: "border-amber-500",
        },
      },
      {
        id: "4",
        title: "DRAFTING MEETING...",
        start: "2024-05-14T17:00:00",
        end: "2024-05-14T18:00:00",
        extendedProps: {
          subtitle: "AI Assistant",
          bgClass: "bg-[#122420]/60 border border-dashed border-[#24453e]",
          borderClass: "border-transparent",
          isDraft: true,
        },
      },
    ];

    const calendarEvents = propEvents || defaultEvents;

    return (
      <div className="w-full h-full overflow-hidden text-zinc-100 fc-dark-theme">
        <FullCalendar
          ref={ref}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate="2024-05-12"
          headerToolbar={false}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          height="100%"
          expandRows={true}
          stickyHeaderDates={true}
          events={calendarEvents}
          eventContent={(eventInfo) => {
            const isDraft = eventInfo.event.extendedProps.isDraft;
            return (
              <div
                className={`h-full w-full p-2.5 rounded-lg flex flex-col justify-between text-left overflow-hidden ${
                  eventInfo.event.extendedProps.bgClass || "bg-zinc-800/40"
                } ${
                  isDraft
                    ? ""
                    : `border-l-3 ${
                        eventInfo.event.extendedProps.borderClass ||
                        "border-zinc-500"
                      }`
                }`}
              >
                <div className="min-w-0">
                  <div
                    className={`font-semibold text-[11px] leading-snug truncate ${
                      isDraft ? "text-[#FFF4E1]/50 font-mono" : "text-[#FFF4E1]"
                    }`}
                  >
                    {eventInfo.event.title}
                  </div>
                  {eventInfo.event.extendedProps.subtitle && (
                    <div className="text-[9px] text-[#FFF4E1]/60 font-medium mt-0.5 truncate">
                      {eventInfo.event.extendedProps.subtitle}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    );
  }
);

CalendarWrapper.displayName = "CalendarWrapper";
