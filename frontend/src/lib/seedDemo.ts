import { getSupabase } from './supabaseClient';
import { getTodayDate, getLastNDays } from './db';

export const seedDemoData = async (userId: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    console.log('Cannot seed: Supabase not initialized');
    return false;
  }

  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!existingProfile) {
      // Create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          height_cm: 180,
          current_weight_kg: 80,
          age: 30,
          activity_level: 'moderate',
        });

      if (profileError) {
        console.log('Error creating profile:', profileError.message);
      }
    }

    // Check if goal exists
    const { data: existingGoal } = await supabase
      .from('user_goals')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!existingGoal) {
      // Create goal
      const { error: goalError } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          target_weight_kg: 72,
          daily_calorie_target: 2000,
          daily_water_goal_ml: 2000,
          sleep_goal_hours: 8,
          is_active: true,
        });

      if (goalError) {
        console.log('Error creating goal:', goalError.message);
      }
    }

    // Create today's checkin if not exists
    const today = getTodayDate();
    const { data: existingCheckin } = await supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .single();

    let todayCheckinId: string;

    if (!existingCheckin) {
      const { data: newCheckin, error: checkinError } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: userId,
          checkin_date: today,
          total_calories_consumed: 600,
          water_intake_ml: 750,
          sleep_hours: 7.0,
          steps_count: 5000,
        })
        .select('id')
        .single();

      if (checkinError) {
        console.log('Error creating checkin:', checkinError.message);
        return false;
      }
      todayCheckinId = newCheckin?.id;
    } else {
      todayCheckinId = existingCheckin.id;
    }

    // Seed last 7 days of exercise data
    const last7Days = getLastNDays(7);
    const exerciseData = [
      { calories: 250, type: 'walk', duration: 30 },
      { calories: 400, type: 'run', duration: 40 },
      { calories: 300, type: 'gym', duration: 45 },
      { calories: 200, type: 'walk', duration: 25 },
      { calories: 450, type: 'gym', duration: 60 },
      { calories: 350, type: 'run', duration: 35 },
      { calories: 280, type: 'walk', duration: 35 },
    ];

    for (let i = 0; i < last7Days.length; i++) {
      const date = last7Days[i];
      
      // Check if checkin exists for this date
      let { data: dayCheckin } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('user_id', userId)
        .eq('checkin_date', date)
        .single();

      if (!dayCheckin) {
        // Create checkin for this day
        const { data: newDayCheckin, error: dayCheckinError } = await supabase
          .from('daily_checkins')
          .insert({
            user_id: userId,
            checkin_date: date,
            total_calories_consumed: 1500 + Math.floor(Math.random() * 500),
            water_intake_ml: 1500 + Math.floor(Math.random() * 1000),
            sleep_hours: 6 + Math.random() * 2,
            steps_count: 4000 + Math.floor(Math.random() * 6000),
          })
          .select('id')
          .single();

        if (dayCheckinError) {
          console.log(`Error creating checkin for ${date}:`, dayCheckinError.message);
          continue;
        }
        dayCheckin = newDayCheckin;
      }

      if (dayCheckin) {
        // Check if activity exists for this checkin
        const { data: existingActivity } = await supabase
          .from('activities')
          .select('id')
          .eq('checkin_id', dayCheckin.id)
          .single();

        if (!existingActivity) {
          // Add activity
          const exerciseInfo = exerciseData[i];
          await supabase
            .from('activities')
            .insert({
              user_id: userId,
              checkin_id: dayCheckin.id,
              activity_type: exerciseInfo.type,
              duration_minutes: exerciseInfo.duration,
              calories_burned: exerciseInfo.calories,
            });
        }
      }
    }

    console.log('Demo data seeded successfully');
    return true;
  } catch (error) {
    console.log('Error seeding demo data:', error);
    return false;
  }
};
