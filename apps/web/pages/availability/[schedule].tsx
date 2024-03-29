import { BadgeCheckIcon } from "@heroicons/react/solid";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { DEFAULT_SCHEDULE, availabilityAsString } from "@calcom/lib/availability";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import showToast from "@calcom/lib/notification";
import Button from "@calcom/ui/Button";
import Switch from "@calcom/ui/Switch";
import { Form } from "@calcom/ui/form/fields";

import { QueryCell } from "@lib/QueryCell";
import { HttpError } from "@lib/core/http/error";
import { inferQueryOutput, trpc } from "@lib/trpc";

import Shell from "@components/Shell";
import Schedule from "@components/availability/Schedule";
import EditableHeading from "@components/ui/EditableHeading";
import TimezoneSelect from "@components/ui/form/TimezoneSelect";
import classNames from "@calcom/lib/classNames";

export function AvailabilityForm(props: inferQueryOutput<"viewer.availability.schedule">) {
  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useContext();

  const form = useForm({
    defaultValues: {
      schedule: props.availability || DEFAULT_SCHEDULE,
      isDefault: !!props.isDefault,
      timeZone: props.timeZone,
    },
  });

  const updateMutation = trpc.useMutation("viewer.availability.schedule.update", {
    onSuccess: async ({ schedule }) => {
      await utils.invalidateQueries(["viewer.availability.schedule"]);
    
      await router.push(router.query.next);
      showToast(
        t("availability_updated_successfully", {
          scheduleName: schedule.name,
        }),
        "success"
      );
    },
    onError: (err) => {
      if (err instanceof HttpError) {
        const message = `${err.statusCode}: ${err.message}`;
        showToast(message, "error");
      }
    },
  });

  return (
    <Form
      form={form}
      handleSubmit={async (values) => {
        updateMutation.mutate({
          scheduleId: parseInt(router.query.schedule as string, 10),
          name: props.schedule.name,
          ...values,
        });
      }}
      className="grid grid-cols-3 gap-2">
      <div className="col-span-3 space-y-2 lg:col-span-2">
        <div className="divide-y rounded-sm border border-gray-200 bg-white px-4 py-5 sm:p-6">
          <h3 className="mb-5 text-base font-medium leading-6 text-gray-900">{t("change_start_end")}</h3>
          <Schedule name="schedule" />
        </div>
        <div className="space-x-2 text-right">
         
          <Button className={classNames("bg-techiepurple rounded-md")}>{t("continue")}</Button>
        </div>
      </div>
    
    </Form>
  );
}

export default function Availability() {
  const router = useRouter();
  const { i18n } = useLocale();
  const query = trpc.useQuery([
    "viewer.availability.schedule",
    {
      scheduleId: parseInt(router.query.schedule as string),
    },
  ]);
  const [name, setName] = useState<string>();
  return (
    <div>
      <QueryCell
        query={query}
        success={({ data }) => {
          return (
            <Shell
             
              subtitle={data.schedule.availability.map((availability) => (
                <span key={availability.id}>
                  {availabilityAsString(availability, i18n.language)}
                  <br />
                </span>
              ))}>
              <AvailabilityForm
                {...{ ...data, schedule: { ...data.schedule, name: name || data.schedule.name } }}
              />
            </Shell>
          );
        }}
      />
    </div>
  );
}
