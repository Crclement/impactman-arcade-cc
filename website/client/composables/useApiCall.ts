import snakecaseKeys from "snakecase-keys";
import camelize from "camelize-ts";

export const useApiCall = async (path: string) => {
  const runtimeConfig = useRuntimeConfig();

  return await useFetch(() => `${runtimeConfig.public.apiBase}${path}`);
};

export const $apiCall = async <T>(
  path: string,
  options?: {
    method: string;
    body?: any;
    headers?: any;
  }
) => {
  if (!options) {
    options = {
      method: "GET",
    };
  }

  if (options.body && !(options.body instanceof FormData)) {
    options.body = snakecaseKeys(options.body, { deep: true });
    // console.log("camel", options.body);
  }

  // Inject auth token if available
  if (process.client) {
    const token = localStorage.getItem('impactarcade_token');
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const res = await $fetch<T>(path, {
    baseURL: useRuntimeConfig().public.apiBase,
    ...options,
  });

  return camelize(res);
};
