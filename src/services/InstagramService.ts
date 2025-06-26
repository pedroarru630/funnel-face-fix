
interface InstagramProfile {
  username: string;
  fullName?: string;
  profilePicUrlHD: string;
  exists: boolean;
}

interface ApifyResponse {
  username?: string;
  fullName?: string;
  profilePicUrlHD?: string;
  profilePicUrl?: string;
  biography?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isPrivate?: boolean;
  isVerified?: boolean;
  url?: string;
}

export class InstagramService {
  private static APIFY_API_URL = 'https://api.apify.com/v2/actor-tasks/chatty_coaster~instagram-scraper-task/run-sync?token=apify_api_Tk435sUb2WnBllXsxxfNQaBLkHSZyz0HLRCO';

  static async getProfile(username: string): Promise<InstagramProfile> {
    try {
      console.log('Fetching Instagram profile for:', username);
      
      const cleanUsername = username.replace('@', '');
      
      const response = await fetch(this.APIFY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search: cleanUsername,
          searchType: "user",
          searchLimit: 1,
          resultsType: "details",
          resultsLimit: 1,
          addParentData: true,
          enhanceUserSearchWithFacebookPage: false,
          isUserReelFeedURL: false,
          isUserTaggedFeedURL: false,
          extendOutputFunction: "",
          extendScraperFunction: "",
          customMapFunction: "",
          proxy: {
            useApifyProxy: true,
            apifyProxyGroups: ["RESIDENTIAL"]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const responseJson = await response.json();
      console.log('=== RAW APIFY API RESPONSE ===');
      console.log('Full response:', JSON.stringify(responseJson, null, 2));

      // Handle array response (most common format)
      if (Array.isArray(responseJson) && responseJson.length > 0) {
        const profileData = responseJson[0] as ApifyResponse;
        console.log('Profile data extracted from array:', profileData);
        
        if (profileData.username) {
          return {
            username: profileData.username,
            fullName: profileData.fullName || profileData.username,
            profilePicUrlHD: profileData.profilePicUrlHD || profileData.profilePicUrl || '',
            exists: true
          };
        }
      }

      // Handle object response with direct profile data
      const profileData = responseJson as ApifyResponse;
      if (profileData.username) {
        console.log('Profile data found in object format:', profileData);
        
        return {
          username: profileData.username,
          fullName: profileData.fullName || profileData.username,
          profilePicUrlHD: profileData.profilePicUrlHD || profileData.profilePicUrl || '',
          exists: true
        };
      }

      // If no detailed data but URL exists, profile exists but limited info
      if (responseJson.urlsFromSearch && responseJson.urlsFromSearch.length > 0) {
        console.log('Found urlsFromSearch but no detailed data - profile exists but limited info');
        
        return {
          username: cleanUsername,
          fullName: cleanUsername,
          profilePicUrlHD: '',
          exists: true
        };
      }

      console.log('No profile data returned from API');
      return {
        username: cleanUsername,
        fullName: undefined,
        profilePicUrlHD: '',
        exists: false
      };
      
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      return {
        username: username.replace('@', ''),
        fullName: undefined,
        profilePicUrlHD: '',
        exists: false
      };
    }
  }
}
