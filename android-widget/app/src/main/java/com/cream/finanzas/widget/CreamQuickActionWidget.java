package com.cream.finanzas.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class CreamQuickActionWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.cream_quick_action_widget);
            views.setOnClickPendingIntent(R.id.cream_expense_button, createOpenIntent(context, "expense", 1000 + widgetId));
            views.setOnClickPendingIntent(R.id.cream_income_button, createOpenIntent(context, "income", 2000 + widgetId));
            manager.updateAppWidget(widgetId, views);
        }
    }

    private PendingIntent createOpenIntent(Context context, String action, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra("quickAction", action);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
